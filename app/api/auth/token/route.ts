import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const token = request.cookies.get('spotify_access_token')?.value

  if (!token) {
    return NextResponse.json({ error: 'No token' }, { status: 401 })
  }

  return NextResponse.json({ token })
}
