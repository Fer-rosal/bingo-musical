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
    return NextResponse.json({
      success: true,
      count: tracks.length,
      tracks: tracks.slice(0, 5),
    })
  } catch (e) {
    console.error('Debug tracks error:', e)
    if (e instanceof SpotifyError) {
      return NextResponse.json(
        {
          error: e.message,
          status: e.status,
        },
        { status: e.status }
      )
    }
    return NextResponse.json(
      { error: String(e) },
      { status: 500 }
    )
  }
}
