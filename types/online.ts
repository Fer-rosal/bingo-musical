export type GameStatus = 'waiting' | 'playing' | 'finished';

export interface GameSession {
  id: string;
  hostSpotifyId: string;
  hostEmail?: string;
  playlistId: string;
  playlistName: string;
  playlistImageUrl?: string;
  gameCode: string; // 6-char alphanumeric
  status: GameStatus;
  gridSize: 4 | 5;
  playerCount: number;
  preMarkedCount: number;
  drawnSongIds: string[]; // Spotify track IDs
  players: GamePlayer[];
  createdAt: number; // timestamp
  startedAt?: number;
  endedAt?: number;
  hostDeviceId?: string;
  winnerPlayerIndex?: number;
}

export interface GamePlayer {
  index: number;
  name: string;
  spotifyId?: string;
  email?: string;
  joinedAt: number;
  hasMarkedAsLine?: boolean;
  hasMarkedAsBingo?: boolean;
}

export interface PlayerCarton {
  gameId: string;
  playerIndex: number;
  spotifyId?: string;
  markedCells: number[]; // indices of marked cells (0-24 for 5x5, 0-15 for 4x4)
  joinedAt: number;
}

export interface OnlineGameConfig {
  gridSize: 4 | 5;
  preMarkedCount: number;
}
