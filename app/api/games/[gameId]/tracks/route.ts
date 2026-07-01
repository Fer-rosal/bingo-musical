import { NextRequest, NextResponse } from 'next/server'
import { getGameSessionById } from '@/lib/db/gameSession'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params

  const game = await getGameSessionById(gameId)
  if (!game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  }

  return NextResponse.json({ tracks: game.tracks })
}
