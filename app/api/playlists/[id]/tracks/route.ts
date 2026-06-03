import { NextRequest, NextResponse } from 'next/server'
import { getPlaylistTracks, SpotifyError, refreshAccessToken } from '../../../../../lib/spotify'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  let token = request.cookies.get('spotify_access_token')?.value
  const refreshToken = request.cookies.get('spotify_refresh_token')?.value

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
      if (e.status === 401 && refreshToken) {
        console.log('Access token expired, attempting refresh...')
        const refreshed = await refreshAccessToken(refreshToken)
        if (refreshed) {
          const response = NextResponse.json({ tracks: await getPlaylistTracks(refreshed.accessToken, id) })
          const expiresAt = Date.now() + refreshed.expiresIn * 1000
          response.cookies.set('spotify_access_token', refreshed.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: refreshed.expiresIn,
          })
          response.cookies.set('spotify_token_expires_at', expiresAt.toString(), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: refreshed.expiresIn,
          })
          return response
        }
      }
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
