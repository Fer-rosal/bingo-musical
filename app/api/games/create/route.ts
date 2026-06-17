import { NextRequest, NextResponse } from 'next/server';
import { createGameSession } from '@/lib/db/gameSession';
import { sendGameCreatedEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('spotify_access_token')?.value;
    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const spotifyRes = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
    if (!spotifyRes.ok) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const me = await spotifyRes.json();
    const hostSpotifyId: string = me.id;
    const hostEmail: string = me.email ?? '';

    const { playlistId, playlistName, playlistImageUrl, gridSize, preMarkedCount, hostDeviceId } = await request.json();

    if (!playlistId || !playlistName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const game = await createGameSession(
      hostSpotifyId,
      hostEmail,
      playlistId,
      playlistName,
      playlistImageUrl,
      { gridSize: gridSize || 5, preMarkedCount: preMarkedCount || 0 },
      hostDeviceId
    );

    // Send confirmation email to host
    try {
      await sendGameCreatedEmail(hostEmail, game.gameCode, playlistName);
    } catch (emailError) {
      console.error('Error sending game creation email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json(game);
  } catch (error) {
    console.error('Error creating game:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Failed to create game', details: errorMessage },
      { status: 500 }
    );
  }
}
