import { NextRequest, NextResponse } from 'next/server';
import { getGameSessionByCode } from '@/lib/db/gameSession';
import { getDb } from '@/lib/supabase';
import { normalizeGameCode, isValidGameCode } from '@/lib/gameCode';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: 'Game code is required' },
        { status: 400 }
      );
    }

    const normalizedCode = normalizeGameCode(code);

    if (!isValidGameCode(normalizedCode)) {
      return NextResponse.json(
        { error: 'Invalid game code format' },
        { status: 400 }
      );
    }

    const game = await getGameSessionByCode(normalizedCode);

    if (!game) {
      // [DEBUG-b7c1] check if the game exists at all (ignore status filter)
      const { data: raw, error: rawError } = await getDb()
        .from('games')
        .select('id, game_code, status')
        .eq('game_code', normalizedCode)
        .maybeSingle();
      console.error('[DEBUG-b7c1] game not found', { normalizedCode, raw, rawError });

      return NextResponse.json(
        { error: 'Game not found or already finished', debug: { normalizedCode, raw, rawError } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: game.id,
      gameCode: game.gameCode,
      playlistName: game.playlistName,
      playlistImageUrl: game.playlistImageUrl,
      playerCount: game.playerCount,
      gridSize: game.gridSize,
      status: game.status,
    });
  } catch (error) {
    console.error('Error searching game:', error);
    return NextResponse.json(
      { error: 'Failed to search for game' },
      { status: 500 }
    );
  }
}
