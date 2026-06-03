import { NextRequest, NextResponse } from 'next/server'
import { refreshAccessToken } from '../../../lib/spotify'

export async function GET(request: NextRequest) {
  let token = request.cookies.get('spotify_access_token')?.value
  const expiresAtStr = request.cookies.get('spotify_token_expires_at')?.value
  const refreshToken = request.cookies.get('spotify_refresh_token')?.value

  if (!token) {
    return NextResponse.json({ error: 'No token' }, { status: 401 })
  }

  // Check if token is expired (with 60s buffer to avoid race conditions)
  if (expiresAtStr) {
    const expiresAt = parseInt(expiresAtStr)
    const now = Date.now()
    const timeUntilExpiry = expiresAt - now

    if (timeUntilExpiry < 60000 && refreshToken) {
      console.log('Token expiring soon, refreshing...')
      const refreshed = await refreshAccessToken(refreshToken)
      if (refreshed) {
        const response = NextResponse.json({ token: refreshed.accessToken })
        const newExpiresAt = now + refreshed.expiresIn * 1000

        response.cookies.set('spotify_access_token', refreshed.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: refreshed.expiresIn,
        })

        response.cookies.set('spotify_token_expires_at', newExpiresAt.toString(), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: refreshed.expiresIn,
        })

        return response
      }
    }
  }

  return NextResponse.json({ token })
}
