import { NextRequest, NextResponse } from 'next/server';
import { getGameSessionById, addPlayerToGame } from '@/lib/db/gameSession';
import { sendPlayerJoinedEmail } from '@/lib/email';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const [{ playerName, spotifyId, email }, { gameId }] = await Promise.all([request.json(), params]);

    if (!playerName) {
      return NextResponse.json(
        { error: 'Player name is required' },
        { status: 400 }
      );
    }

    const game = await getGameSessionById(gameId);
    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    if (game.status === 'finished') {
      return NextResponse.json(
        { error: 'Game is finished, cannot join' },
        { status: 400 }
      );
    }

    const playerIndex = await addPlayerToGame(gameId, playerName, spotifyId, email);

    // Send notification email to host
    try {
      const updatedGame = await getGameSessionById(gameId);
      if (updatedGame?.hostEmail) {
        await sendPlayerJoinedEmail(
          updatedGame.hostEmail,
          playerName,
          game.gameCode,
          updatedGame.playerCount
        );
      }
    } catch (emailError) {
      console.error('Error sending player joined email:', emailError);
    }

    return NextResponse.json({
      playerIndex,
      gameCode: game.gameCode,
      playlistId: game.playlistId,
      gridSize: game.gridSize,
      preMarkedCount: game.preMarkedCount,
      drawnSongIds: game.drawnSongIds,
    });
  } catch (error) {
    console.error('Error joining game:', error);
    return NextResponse.json(
      { error: 'Failed to join game' },
      { status: 500 }
    );
  }
}
