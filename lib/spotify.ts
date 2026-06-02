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
    throw new SpotifyError(res.status, body?.error?.message ?? res.statusText)
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

export async function getPlaylistTracks(
  token: string,
  playlistId: string
): Promise<SpotifyTrack[]> {
  const items: SpotifyTrack[] = []
  let url = `/playlists/${playlistId}/tracks?limit=100&offset=0&fields=next,items(track(id,name,artists))`

  while (url) {
    const page = await spotifyFetch<{
      items: { track: SpotifyTrack | null }[]
      next: string | null
    }>(url, token)

    items.push(...page.items.map(i => i.track).filter(Boolean) as SpotifyTrack[])
    url = page.next ? page.next.replace(SPOTIFY_BASE, '') : ''
  }

  return items
}
