import { NextRequest, NextResponse } from 'next/server'
import { getUserPlaylists, SpotifyError, refreshAccessToken } from '../../../lib/spotify'

export async function GET(request: NextRequest) {
  let token = request.cookies.get('spotify_access_token')?.value
  const refreshToken = request.cookies.get('spotify_refresh_token')?.value

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
    if (e instanceof SpotifyError && e.status === 401 && refreshToken) {
      console.log('Access token expired, attempting refresh...')
      const refreshed = await refreshAccessToken(refreshToken)
      if (refreshed) {
        const response = NextResponse.json({ playlists: await getUserPlaylists(refreshed.accessToken) })
        response.cookies.set('spotify_access_token', refreshed.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: refreshed.expiresIn,
        })
        return response
      }
    }
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
