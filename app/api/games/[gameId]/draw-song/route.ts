import { NextRequest, NextResponse } from 'next/server';
import { getGameSessionById, addDrawnSong } from '@/lib/db/gameSession';

export async function POST(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  try {
    const { songId } = await request.json();
    const gameId = params.gameId;

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
