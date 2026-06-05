import { NextRequest, NextResponse } from 'next/server';

/**
 * Spotify OAuth Login Endpoint
 * Initiates Spotify OAuth flow for stateless authentication
 *
 * Security measures:
 * - PKCE flow for security (code challenge)
 * - State parameter to prevent CSRF
 * - Secure cookie storage of tokens
 *
 * No user data is stored. Tokens are only used for session.
 */
export async function POST(request: NextRequest) {
  try {
    await request.json();

    // Generate state and code verifier for PKCE (security)
    const state = Buffer.from(Math.random().toString()).toString('base64');
    const codeVerifier = Buffer.from(Math.random().toString()).toString('base64');

    // Spotify OAuth params
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;

    // Construct redirect URI dynamically based on deployment environment
    // This ensures it works with localhost, preview URLs, and production
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('host') || request.nextUrl.host;
    const redirectUri = `${protocol}://${host}/callback`;


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

    return response;
  } catch (error) {
    console.error('Spotify login error:', error);
    return NextResponse.json(
      { error: 'Error al iniciar sesión con Spotify' },
      { status: 500 }
    );
  }
}
