import { NextRequest, NextResponse } from 'next/server'
import { getPlaylistInfo, SpotifyError } from '../../../../../lib/spotify'

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
    const playlist = await getPlaylistInfo(token, id)
    return NextResponse.json({
      success: true,
      playlist: {
        id: playlist.id,
        name: playlist.name,
        owner: playlist.owner?.display_name,
        public: (playlist as any).public,
        collaborative: (playlist as any).collaborative,
        tracks: playlist.tracks?.total,
      },
    })
  } catch (e) {
    console.error('Debug error:', e)
    if (e instanceof SpotifyError) {
      return NextResponse.json(
        {
          error: e.message,
          status: e.status,
          debug: 'If 403: Spotify denies access. Check if playlist is public or if you own it.',
        },
        { status: e.status }
      )
    }
    return NextResponse.json(
      { error: 'Error', details: String(e) },
      { status: 500 }
    )
  }
}
