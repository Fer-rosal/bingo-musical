import { NextRequest, NextResponse } from 'next/server'
import { getPlaylistTracks, SpotifyError } from '../../../../../lib/spotify'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const token = request.cookies.get('spotify_access_token')?.value

  if (!token) {
    return NextResponse.json(
      { error: 'No autenticado' },
      { status: 401 }
    )
  }

  try {
    const tracks = await getPlaylistTracks(token, id)
    return NextResponse.json({ tracks })
  } catch (e) {
    console.error('Error fetching playlist tracks:', e)
    if (e instanceof SpotifyError) {
      if (e.status === 401) {
        return NextResponse.json(
          { error: 'Token expirado' },
          { status: 401 }
        )
      }
      if (e.status === 403) {
        return NextResponse.json(
          { error: 'No tienes permiso para acceder a esta playlist. Puede ser privada o estar restringida.' },
          { status: 403 }
        )
      }
      return NextResponse.json(
        { error: `Spotify error: ${e.message}` },
        { status: e.status }
      )
    }
    return NextResponse.json(
      { error: 'Error al obtener canciones' },
      { status: 500 }
    )
  }
}
