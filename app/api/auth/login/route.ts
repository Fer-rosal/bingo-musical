import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function GET() {
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID
  const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: 'Missing Spotify configuration' },
      { status: 500 }
    )
  }

  const state = crypto.randomBytes(16).toString('hex')
  const scope = 'playlist-read-private playlist-read-collaborative'

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    state,
    scope,
  })

  const spotifyAuthUrl = `https://accounts.spotify.com/authorize?${params.toString()}`

  const response = NextResponse.redirect(spotifyAuthUrl)
  response.cookies.set('spotify_auth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  })

  return response
}
