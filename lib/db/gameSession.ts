import { adminDb } from '@/lib/firebase-admin';
import { GameSession, GamePlayer, OnlineGameConfig } from '@/types/online';
import { generateGameCode } from '@/lib/gameCode';

const GAMES_COLLECTION = 'games';

export async function createGameSession(
  hostSpotifyId: string,
  hostEmail: string,
  playlistId: string,
  playlistName: string,
  playlistImageUrl: string | undefined,
  config: OnlineGameConfig,
  hostDeviceId?: string
): Promise<GameSession> {
  if (!hostSpotifyId) throw new Error('hostSpotifyId is required');
  if (!playlistId) throw new Error('playlistId is required');

  const gameCode = generateGameCode();
  const now = Date.now();
  const ref = adminDb.collection(GAMES_COLLECTION).doc();

  const gameData: GameSession = {
    id: ref.id,
    hostSpotifyId,
    hostEmail,
    playlistId,
    playlistName,
    playlistImageUrl,
    gameCode,
    status: 'waiting',
    gridSize: config.gridSize,
    playerCount: 0,
    preMarkedCount: config.preMarkedCount,
    drawnSongIds: [],
    players: [],
    createdAt: now,
    hostDeviceId,
  };

  await ref.set(gameData);
  return gameData;
}

export async function getGameSessionById(gameId: string): Promise<GameSession | null> {
  const snap = await adminDb.collection(GAMES_COLLECTION).doc(gameId).get();
  if (!snap.exists) return null;
  return snap.data() as GameSession;
}

export async function getGameSessionByCode(gameCode: string): Promise<GameSession | null> {
  const snap = await adminDb
    .collection(GAMES_COLLECTION)
    .where('gameCode', '==', gameCode)
    .where('status', '!=', 'finished')
    .limit(1)
    .get();

  if (snap.empty) return null;
  return snap.docs[0].data() as GameSession;
}

export async function addPlayerToGame(
  gameId: string,
  playerName: string,
  spotifyId?: string,
  email?: string
): Promise<number> {
  const ref = adminDb.collection(GAMES_COLLECTION).doc(gameId);
  const snap = await ref.get();

  if (!snap.exists) throw new Error('Game not found');

  const game = snap.data() as GameSession;
  if (game.status === 'finished') throw new Error('Game is finished');

  const newPlayer: GamePlayer = {
    index: game.players.length,
    name: playerName,
    spotifyId,
    email,
    joinedAt: Date.now(),
  };

  game.players.push(newPlayer);
  game.playerCount = game.players.length;

  await ref.update({ players: game.players, playerCount: game.playerCount });
  return newPlayer.index;
}

export async function updateGameStatus(
  gameId: string,
  status: 'waiting' | 'playing' | 'finished'
): Promise<void> {
  const updateData: Record<string, unknown> = { status };
  if (status === 'playing') updateData.startedAt = Date.now();
  else if (status === 'finished') updateData.endedAt = Date.now();

  await adminDb.collection(GAMES_COLLECTION).doc(gameId).update(updateData);
}

export async function addDrawnSong(gameId: string, songId: string): Promise<void> {
  const ref = adminDb.collection(GAMES_COLLECTION).doc(gameId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('Game not found');

  const game = snap.data() as GameSession;
  if (!game.drawnSongIds.includes(songId)) {
    game.drawnSongIds.push(songId);
    await ref.update({ drawnSongIds: game.drawnSongIds });
  }
}

export async function confirmWinner(gameId: string, playerIndex: number): Promise<void> {
  await adminDb.collection(GAMES_COLLECTION).doc(gameId).update({
    status: 'finished',
    winnerPlayerIndex: playerIndex,
    endedAt: Date.now(),
  });
}

export async function getPlayerGames(spotifyId: string): Promise<GameSession[]> {
  const snap = await adminDb
    .collection(GAMES_COLLECTION)
    .where('hostSpotifyId', '==', spotifyId)
    .get();

  return snap.docs.map((d) => d.data() as GameSession);
}
