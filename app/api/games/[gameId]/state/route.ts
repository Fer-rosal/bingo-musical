import { NextResponse } from 'next/server';
import { getGameSessionById } from '@/lib/db/gameSession';

export async function GET(
  _: unknown,
  { params }: { params: { gameId: string } }
) {
  try {
    const gameId = params.gameId;
    const game = await getGameSessionById(gameId);

    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: game.status,
      drawnSongIds: game.drawnSongIds,
      playerCount: game.playerCount,
      players: game.players,
      winnerPlayerIndex: game.winnerPlayerIndex,
    });
  } catch (error) {
    console.error('Error fetching game state:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game state' },
      { status: 500 }
    );
  }
}
