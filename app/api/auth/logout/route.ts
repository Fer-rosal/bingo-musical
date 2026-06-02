import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const origin = request.headers.get('x-forwarded-proto') && request.headers.get('x-forwarded-host')
    ? `${request.headers.get('x-forwarded-proto')}://${request.headers.get('x-forwarded-host')}`
    : request.nextUrl.origin

  const response = NextResponse.redirect(`${origin}/api/auth/login`)

  response.cookies.delete('spotify_access_token')
  response.cookies.delete('spotify_refresh_token')
  response.cookies.delete('spotify_auth_state')

  return response
}
