import { NextRequest, NextResponse } from 'next/server';
import { deleteUserAccount } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('spotify_access_token')?.value;
    if (!accessToken) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Resolve the Spotify user making the request
    const meRes = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!meRes.ok) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    const { id: spotifyId } = await meRes.json();

    await deleteUserAccount(spotifyId);

    console.log(`[GDPR] Account deleted: ${spotifyId} at ${new Date().toISOString()}`);

    const response = NextResponse.json({
      success: true,
      message: 'Tu cuenta ha sido eliminada permanentemente',
      deletedAt: new Date().toISOString(),
    });

    // Clear auth cookies
    response.cookies.delete('spotify_access_token');
    response.cookies.delete('spotify_refresh_token');

    return response;
  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json({ error: 'Error al eliminar la cuenta' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Para acceder a tus datos o solicitar eliminación, contacta: privacy@bingomusical.es',
    rights: [
      'Acceso a tus datos personales',
      'Corrección de datos inexactos',
      'Eliminación (Derecho al Olvido)',
      'Restricción del tratamiento',
      'Portabilidad de datos',
    ],
    contactEmail: 'privacy@bingomusical.es',
    responseTime: '30 días hábiles (requisito legal RGPD)',
  });
}
