import type { SpotifyPlaylist, SpotifyTrack } from '../types/bingo'

const SPOTIFY_BASE = 'https://api.spotify.com/v1'

export class SpotifyError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
  }
}

async function spotifyFetch<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${SPOTIFY_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const message = body?.error?.message ?? res.statusText
    console.error(`Spotify ${res.status} error on ${path}:`, { message, fullResponse: body })
    throw new SpotifyError(res.status, message)
  }

  return res.json() as Promise<T>
}

export async function getUserPlaylists(token: string): Promise<SpotifyPlaylist[]> {
  const items: SpotifyPlaylist[] = []
  let url = `/me/playlists?limit=50&offset=0`

  while (url) {
    const page = await spotifyFetch<{
      items: SpotifyPlaylist[]
      next: string | null
    }>(url, token)

    items.push(...page.items)
    url = page.next ? page.next.replace(SPOTIFY_BASE, '') : ''
  }

  return items
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; expiresIn: number } | null> {
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) return null

  try {
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }).toString(),
    })

    if (!res.ok) {
      console.error('Failed to refresh token:', await res.json().catch(() => ({})))
      return null
    }

    const data = await res.json()
    return { accessToken: data.access_token, expiresIn: data.expires_in }
  } catch (e) {
    console.error('Token refresh error:', e)
    return null
  }
}

export async function getPlaylistInfo(
  token: string,
  playlistId: string
): Promise<SpotifyPlaylist> {
  return spotifyFetch<SpotifyPlaylist>(
    `/playlists/${playlistId}`,
    token
  )
}

export async function getPlaylistTracks(
  token: string,
  playlistId: string
): Promise<SpotifyTrack[]> {
  const items: SpotifyTrack[] = []
  let url = `/playlists/${playlistId}/items?limit=50`

  while (url) {
    const page = await spotifyFetch<{
      items: Array<{ item?: any } | null>
      next: string | null
    }>(url, token)

    const pageTracks = page.items
      .map(i => {
        const track = i?.item
        if (!track) return null
        return {
          id: track.id,
          name: track.name,
          artists: track.artists,
          preview_url: track.preview_url,
        } as SpotifyTrack
      })
      .filter((track): track is SpotifyTrack => track !== null)
    items.push(...pageTracks)
    url = page.next ? page.next.replace(SPOTIFY_BASE, '') : ''
  }

  return items
}
