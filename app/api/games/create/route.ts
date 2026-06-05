import { NextRequest, NextResponse } from 'next/server';
import { createGameSession } from '@/lib/db/gameSession';
import { sendGameCreatedEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { hostSpotifyId, hostEmail, playlistId, playlistName, playlistImageUrl, gridSize, preMarkedCount, hostDeviceId } = await request.json();

    if (!hostSpotifyId || !hostEmail || !playlistId || !playlistName) {
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
