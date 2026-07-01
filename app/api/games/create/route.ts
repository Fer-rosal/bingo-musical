import { NextRequest, NextResponse } from 'next/server';
import { createGameSession } from '@/lib/db/gameSession';
import { sendGameCreatedEmail } from '@/lib/email';
import { getPlaylistTracks } from '@/lib/spotify';

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

    const tracks = await getPlaylistTracks(accessToken, playlistId);

    const game = await createGameSession(
      hostSpotifyId,
      hostEmail,
      playlistId,
      playlistName,
      playlistImageUrl,
      { gridSize: gridSize || 5, preMarkedCount: preMarkedCount || 0 },
      tracks,
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
    const hasKey = !!process.env.FIREBASE_PRIVATE_KEY;
    const hasProject = !!process.env.FIREBASE_PROJECT_ID;
    const hasEmail = !!process.env.FIREBASE_CLIENT_EMAIL;
    return NextResponse.json(
      { error: 'Failed to create game', details: errorMessage, envCheck: { hasKey, hasProject, hasEmail } },
      { status: 500 }
    );
  }
}
