import { NextRequest, NextResponse } from 'next/server'
import { getUserPlaylists, SpotifyError } from '../../../lib/spotify'

export async function GET(request: NextRequest) {
  const token = request.cookies.get('spotify_access_token')?.value

  if (!token) {
    return NextResponse.json(
      { error: 'No autenticado' },
      { status: 401 }
    )
  }

  try {
    const playlists = await getUserPlaylists(token)
    return NextResponse.json({ playlists })
  } catch (e) {
    if (e instanceof SpotifyError && e.status === 401) {
      return NextResponse.json(
        { error: 'Token expirado' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Error al obtener playlists' },
      { status: 500 }
    )
  }
}
