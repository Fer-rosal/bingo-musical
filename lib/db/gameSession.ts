import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
  const gameCode = generateGameCode();
  const now = Date.now();

  const gameData: GameSession = {
    id: doc(collection(db, GAMES_COLLECTION)).id, // Generate doc ID
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

  const gameRef = doc(db, GAMES_COLLECTION, gameData.id);
  await setDoc(gameRef, gameData);

  return gameData;
}

export async function getGameSessionById(gameId: string): Promise<GameSession | null> {
  const gameRef = doc(db, GAMES_COLLECTION, gameId);
  const gameSnap = await getDoc(gameRef);

  if (!gameSnap.exists()) {
    return null;
  }

  return gameSnap.data() as GameSession;
}

export async function getGameSessionByCode(gameCode: string): Promise<GameSession | null> {
  const q = query(
    collection(db, GAMES_COLLECTION),
    where('gameCode', '==', gameCode),
    where('status', '!=', 'finished')
  );

  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return null;
  }

  return querySnapshot.docs[0].data() as GameSession;
}

export async function addPlayerToGame(
  gameId: string,
  playerName: string,
  spotifyId?: string,
  email?: string
): Promise<number> {
  const gameRef = doc(db, GAMES_COLLECTION, gameId);
  const gameSnap = await getDoc(gameRef);

  if (!gameSnap.exists()) {
    throw new Error('Game not found');
  }

  const game = gameSnap.data() as GameSession;

  if (game.status === 'finished') {
    throw new Error('Game is finished');
  }

  const playerIndex = game.players.length;
  const newPlayer: GamePlayer = {
    index: playerIndex,
    name: playerName,
    spotifyId,
    email,
    joinedAt: Date.now(),
  };

  game.players.push(newPlayer);
  game.playerCount = game.players.length;

  await updateDoc(gameRef, {
    players: game.players,
    playerCount: game.playerCount,
  });

  return playerIndex;
}

export async function updateGameStatus(
  gameId: string,
  status: 'waiting' | 'playing' | 'finished'
): Promise<void> {
  const gameRef = doc(db, GAMES_COLLECTION, gameId);

  const updateData: any = { status };
  if (status === 'playing') {
    updateData.startedAt = Date.now();
  } else if (status === 'finished') {
    updateData.endedAt = Date.now();
  }

  await updateDoc(gameRef, updateData);
}

export async function addDrawnSong(gameId: string, songId: string): Promise<void> {
  const gameRef = doc(db, GAMES_COLLECTION, gameId);
  const gameSnap = await getDoc(gameRef);

  if (!gameSnap.exists()) {
    throw new Error('Game not found');
  }

  const game = gameSnap.data() as GameSession;

  if (!game.drawnSongIds.includes(songId)) {
    game.drawnSongIds.push(songId);
    await updateDoc(gameRef, {
      drawnSongIds: game.drawnSongIds,
    });
  }
}

export async function confirmWinner(gameId: string, playerIndex: number): Promise<void> {
  const gameRef = doc(db, GAMES_COLLECTION, gameId);

  await updateDoc(gameRef, {
    status: 'finished',
    winnerPlayerIndex: playerIndex,
    endedAt: Date.now(),
  });
}

export async function getPlayerGames(spotifyId: string): Promise<GameSession[]> {
  const q = query(
    collection(db, GAMES_COLLECTION),
    where('hostSpotifyId', '==', spotifyId)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data() as GameSession);
}
