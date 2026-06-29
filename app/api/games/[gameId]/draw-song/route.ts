import { NextRequest, NextResponse } from 'next/server';
import { getGameSessionById, addDrawnSong, updateGameStatus } from '@/lib/db/gameSession';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const [{ songId }, { gameId }] = await Promise.all([request.json(), params]);

    if (!songId) {
      return NextResponse.json(
        { error: 'Song ID is required' },
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
        { error: 'Game is finished' },
        { status: 400 }
      );
    }

    if (game.status === 'waiting') {
      await updateGameStatus(gameId, 'playing');
    }
    await addDrawnSong(gameId, songId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error drawing song:', error);
    return NextResponse.json(
      { error: 'Failed to draw song' },
      { status: 500 }
    );
  }
}
