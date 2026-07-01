import { NextRequest, NextResponse } from 'next/server'
import { getGameSessionById } from '@/lib/db/gameSession'
import { getPlaylistTracks, getAppAccessToken, SpotifyError } from '@/lib/spotify'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params

  const game = await getGameSessionById(gameId)
  if (!game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  }

  try {
    const token = await getAppAccessToken()
    const tracks = await getPlaylistTracks(token, game.playlistId)
    return NextResponse.json({ tracks })
  } catch (e) {
    console.error('Error fetching game playlist tracks:', e)
    if (e instanceof SpotifyError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    return NextResponse.json({ error: 'Error al obtener canciones' }, { status: 500 })
  }
}
