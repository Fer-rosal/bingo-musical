export interface SpotifyPlaylist {
  id: string
  name: string
  images: { url: string }[]
  tracks: { total: number }
}

export interface SpotifyTrack {
  id: string
  name: string
  artists: { name: string }[]
}

export interface GameConfig {
  playlistId: string
  playlistName: string
  playerCount: number
  gridSize: 4 | 5
  preMarkedCount: number
}

export interface BingoCard {
  id: number
  grid: (SpotifyTrack | null)[][]
}

export interface GameState {
  id: string
  config: GameConfig
  tracks: SpotifyTrack[]
  shuffledQueue: string[]
  drawnIds: string[]
  status: 'playing' | 'line-check' | 'bingo-check' | 'finished'
  createdAt: string
}

export interface GameHistoryEntry {
  id: string
  playlistName: string
  playerCount: number
  gridSize: 4 | 5
  date: string
  status: 'finished' | 'abandoned'
}
