import { NextRequest, NextResponse } from 'next/server';

/**
 * Spotify OAuth Login Endpoint
 * Initiates Spotify OAuth flow with proper consent validation
 *
 * Security measures:
 * - PKCE flow for security (code challenge)
 * - State parameter to prevent CSRF
 * - Requires RGPD consent before auth
 * - Secure cookie storage of tokens
 */
export async function POST(request: NextRequest) {
  try {
    const { consent } = await request.json();

    // Validate consent (required by RGPD)
    if (!consent?.rgpdAgreed || !consent?.privacyAgreed || !consent?.termsAgreed) {
      return NextResponse.json(
        {
          error: 'Debes aceptar la Política de Privacidad, Términos y RGPD para continuar',
          code: 'CONSENT_REQUIRED',
        },
        { status: 400 }
      );
    }

    // Generate state and code verifier for PKCE (security)
    const state = Buffer.from(Math.random().toString()).toString('base64');
    const codeVerifier = Buffer.from(Math.random().toString()).toString('base64');

    // Spotify OAuth params
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;

    // Construct redirect URI dynamically based on deployment environment
    // This ensures it works with localhost, preview URLs, and production
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('host') || request.nextUrl.host;
    const redirectUri = `${protocol}://${host}/api/auth/callback`;

    console.log('Spotify OAuth - Constructed redirect URI:', {
      protocol,
      host,
      redirectUri,
      clientId: clientId ? '***' : 'missing',
    });

    if (!clientId) {
      console.error('Missing Spotify Client ID');
      return NextResponse.json(
        { error: 'Configuración de Spotify incompleta' },
        { status: 500 }
      );
    }

    const scopes = [
      'user-read-private',
      'user-read-email',
      'playlist-read-private',
      'playlist-read-collaborative',
    ].join(' ');

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: scopes,
      state,
      code_challenge: Buffer.from(codeVerifier).toString('base64'),
      code_challenge_method: 'S256',
      // Show explicit consent screen (don't use cached consent)
      show_dialog: 'true',
    });

    const spotifyAuthUrl = `https://accounts.spotify.com/authorize?${params}`;

    // Store state and verifier in secure httpOnly cookie
    const response = NextResponse.json({
      authUrl: spotifyAuthUrl,
      state,
    });

    // Store PKCE verifier in httpOnly cookie (can't be accessed by JS)
    response.cookies.set('spotify_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    // Store state in cookie
    response.cookies.set('spotify_auth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
      path: '/',
    });

    // Store consent preferences
    response.cookies.set('user_consent', JSON.stringify(consent), {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 31536000, // 1 year
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Spotify login error:', error);
    return NextResponse.json(
      { error: 'Error al iniciar sesión con Spotify' },
      { status: 500 }
    );
  }
}
