import { NextRequest, NextResponse } from 'next/server'
import { SpotifyError } from '../../../../../lib/spotify'

const SPOTIFY_BASE = 'https://api.spotify.com/v1'

async function spotifyFetch(path: string, token: string) {
  const res = await fetch(`${SPOTIFY_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new SpotifyError(res.status, body?.error?.message ?? res.statusText)
  }

  return res.json()
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const token = request.cookies.get('spotify_access_token')?.value

  if (!token) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  try {
    const data = await spotifyFetch(`/playlists/${id}/items?limit=5`, token)
    return NextResponse.json({
      raw_response: data,
      items_count: data.items?.length || 0,
      first_item: data.items?.[0],
    })
  } catch (e) {
    if (e instanceof SpotifyError) {
      return NextResponse.json(
        { error: e.message, status: e.status },
        { status: e.status }
      )
    }
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
