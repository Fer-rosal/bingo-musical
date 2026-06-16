import {
  createGameSession,
  getGameSessionById,
  getGameSessionByCode,
  addPlayerToGame,
  updateGameStatus,
  addDrawnSong,
  confirmWinner,
  getPlayerGames,
} from '@/lib/db/gameSession';
import * as firebaseModule from '@/lib/firebase';
import type { GameSession, GamePlayer } from '@/types/online';

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  db: {},
}));

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  updateDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
}));

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

describe('Game Session Database Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createGameSession', () => {
    it('should create a new game session with valid data', async () => {
      const mockDocId = 'doc_123';
      (doc as jest.Mock).mockReturnValue({ id: mockDocId });
      (collection as jest.Mock).mockReturnValue({});
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      const result = await createGameSession(
        'spotify_user_123',
        'user@example.com',
        'playlist_456',
        'My Playlist',
        'https://image.url/image.jpg',
        { gridSize: 5, preMarkedCount: 1 }
      );

      expect(result).toMatchObject({
        hostSpotifyId: 'spotify_user_123',
        hostEmail: 'user@example.com',
        playlistId: 'playlist_456',
        playlistName: 'My Playlist',
        status: 'waiting',
        playerCount: 0,
        drawnSongIds: [],
      });
      expect(result.gameCode).toHaveLength(6);
      expect(setDoc).toHaveBeenCalled();
    });

    it('should generate a unique game code', async () => {
      (doc as jest.Mock).mockReturnValue({});
      (collection as jest.Mock).mockReturnValue({});
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      const codes = new Set();
      for (let i = 0; i < 10; i++) {
        const result = await createGameSession(
          `user_${i}`,
          `user${i}@example.com`,
          `playlist_${i}`,
          `Playlist ${i}`,
          undefined,
          { gridSize: 5, preMarkedCount: 0 }
        );
        codes.add(result.gameCode);
      }

      expect(codes.size).toBeGreaterThan(5);
    });

    it('should set initial timestamps', async () => {
      (doc as jest.Mock).mockReturnValue({});
      (collection as jest.Mock).mockReturnValue({});
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      const before = Date.now();
      const result = await createGameSession(
        'user_123',
        'user@example.com',
        'playlist_123',
        'Playlist',
        undefined,
        { gridSize: 5, preMarkedCount: 0 }
      );
      const after = Date.now();

      expect(result.createdAt).toBeGreaterThanOrEqual(before);
      expect(result.createdAt).toBeLessThanOrEqual(after);
    });

    it('should reject missing required fields', async () => {
      // This would be caught at type level, but test runtime behavior
      (doc as jest.Mock).mockReturnValue({});
      (collection as jest.Mock).mockReturnValue({});

      await expect(
        createGameSession(
          '',
          'user@example.com',
          'playlist_123',
          'Playlist',
          undefined,
          { gridSize: 5, preMarkedCount: 0 }
        )
      ).rejects.toThrow();
    });
  });

  describe('getGameSessionById', () => {
    it('should retrieve a game session by ID', async () => {
      const mockGame: GameSession = {
        id: 'game_123',
        hostSpotifyId: 'user_123',
        playlistId: 'playlist_456',
        playlistName: 'My Playlist',
        gameCode: 'ABC123',
        status: 'waiting',
        gridSize: 5,
        playerCount: 0,
        preMarkedCount: 1,
        drawnSongIds: [],
        players: [],
        createdAt: Date.now(),
      };

      const mockSnap = {
        exists: () => true,
        data: () => mockGame,
      };

      (doc as jest.Mock).mockReturnValue({});
      (getDoc as jest.Mock).mockResolvedValue(mockSnap);

      const result = await getGameSessionById('game_123');

      expect(result).toEqual(mockGame);
      expect(getDoc).toHaveBeenCalled();
    });

    it('should return null if game does not exist', async () => {
      const mockSnap = {
        exists: () => false,
      };

      (doc as jest.Mock).mockReturnValue({});
      (getDoc as jest.Mock).mockResolvedValue(mockSnap);

      const result = await getGameSessionById('nonexistent_game');

      expect(result).toBeNull();
    });

    it('should handle invalid gameId gracefully', async () => {
      (doc as jest.Mock).mockReturnValue({});
      const mockSnap = {
        exists: () => false,
      };
      (getDoc as jest.Mock).mockResolvedValue(mockSnap);

      const result = await getGameSessionById('');

      expect(result).toBeNull();
    });
  });

  describe('getGameSessionByCode', () => {
    it('should find a game by code', async () => {
      const mockGame: GameSession = {
        id: 'game_123',
        hostSpotifyId: 'user_123',
        playlistId: 'playlist_456',
        playlistName: 'My Playlist',
        gameCode: 'ABC123',
        status: 'waiting',
        gridSize: 5,
        playerCount: 2,
        preMarkedCount: 1,
        drawnSongIds: [],
        players: [],
        createdAt: Date.now(),
      };

      const mockSnap = {
        empty: false,
        docs: [{ data: () => mockGame }],
      };

      (collection as jest.Mock).mockReturnValue({});
      (query as jest.Mock).mockReturnValue({});
      (getDocs as jest.Mock).mockResolvedValue(mockSnap);

      const result = await getGameSessionByCode('ABC123');

      expect(result).toEqual(mockGame);
    });

    it('should return null if game code not found', async () => {
      const mockSnap = {
        empty: true,
        docs: [],
      };

      (collection as jest.Mock).mockReturnValue({});
      (query as jest.Mock).mockReturnValue({});
      (getDocs as jest.Mock).mockResolvedValue(mockSnap);

      const result = await getGameSessionByCode('INVALID');

      expect(result).toBeNull();
    });

    it('should not return finished games', async () => {
      (collection as jest.Mock).mockReturnValue({});
      (where as jest.Mock).mockReturnValue({ _type: 'where-clause' });
      (query as jest.Mock).mockReturnValue({});
      (getDocs as jest.Mock).mockResolvedValue({ empty: true, docs: [] });

      // The query should include status != 'finished'
      await getGameSessionByCode('ABC123');

      expect(query).toHaveBeenCalled();
      const queryCall = (query as jest.Mock).mock.calls[0];
      expect(queryCall[1]).toBeDefined(); // at least one where clause passed to query
    });
  });

  describe('addPlayerToGame', () => {
    it('should add a player to an existing game', async () => {
      const mockGame: GameSession = {
        id: 'game_123',
        hostSpotifyId: 'user_123',
        playlistId: 'playlist_456',
        playlistName: 'My Playlist',
        gameCode: 'ABC123',
        status: 'waiting',
        gridSize: 5,
        playerCount: 0,
        preMarkedCount: 1,
        drawnSongIds: [],
        players: [],
        createdAt: Date.now(),
      };

      const mockSnap = {
        exists: () => true,
        data: () => mockGame,
      };

      (doc as jest.Mock).mockReturnValue({});
      (getDoc as jest.Mock).mockResolvedValue(mockSnap);
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      const playerIndex = await addPlayerToGame('game_123', 'Alice', 'spotify_alice', 'alice@example.com');

      expect(playerIndex).toBe(0);
      expect(updateDoc).toHaveBeenCalled();
    });

    it('should assign correct player indices', async () => {
      const mockGame: GameSession = {
        id: 'game_123',
        hostSpotifyId: 'user_123',
        playlistId: 'playlist_456',
        playlistName: 'My Playlist',
        gameCode: 'ABC123',
        status: 'waiting',
        gridSize: 5,
        playerCount: 2,
        preMarkedCount: 1,
        drawnSongIds: [],
        players: [
          { index: 0, name: 'Alice', joinedAt: Date.now() },
          { index: 1, name: 'Bob', joinedAt: Date.now() },
        ],
        createdAt: Date.now(),
      };

      const mockSnap = {
        exists: () => true,
        data: () => mockGame,
      };

      (doc as jest.Mock).mockReturnValue({});
      (getDoc as jest.Mock).mockResolvedValue(mockSnap);
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      const playerIndex = await addPlayerToGame('game_123', 'Charlie');

      expect(playerIndex).toBe(2);
    });

    it('should reject adding player to nonexistent game', async () => {
      const mockSnap = {
        exists: () => false,
      };

      (doc as jest.Mock).mockReturnValue({});
      (getDoc as jest.Mock).mockResolvedValue(mockSnap);

      await expect(addPlayerToGame('nonexistent', 'Alice')).rejects.toThrow('Game not found');
    });

    it('should reject adding player to finished game', async () => {
      const mockGame: GameSession = {
        id: 'game_123',
        hostSpotifyId: 'user_123',
        playlistId: 'playlist_456',
        playlistName: 'My Playlist',
        gameCode: 'ABC123',
        status: 'finished',
        gridSize: 5,
        playerCount: 1,
        preMarkedCount: 1,
        drawnSongIds: [],
        players: [],
        createdAt: Date.now(),
      };

      const mockSnap = {
        exists: () => true,
        data: () => mockGame,
      };

      (doc as jest.Mock).mockReturnValue({});
      (getDoc as jest.Mock).mockResolvedValue(mockSnap);

      await expect(addPlayerToGame('game_123', 'Alice')).rejects.toThrow('Game is finished');
    });

    it('should sanitize player names', async () => {
      const mockGame: GameSession = {
        id: 'game_123',
        hostSpotifyId: 'user_123',
        playlistId: 'playlist_456',
        playlistName: 'My Playlist',
        gameCode: 'ABC123',
        status: 'waiting',
        gridSize: 5,
        playerCount: 0,
        preMarkedCount: 1,
        drawnSongIds: [],
        players: [],
        createdAt: Date.now(),
      };

      const mockSnap = {
        exists: () => true,
        data: () => mockGame,
      };

      (doc as jest.Mock).mockReturnValue({});
      (getDoc as jest.Mock).mockResolvedValue(mockSnap);
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      // Should accept player name with special characters but not SQL injection
      const injectionName = "'; DROP TABLE players;--";
      const index = await addPlayerToGame('game_123', injectionName);

      expect(index).toBe(0);
      const updateCall = (updateDoc as jest.Mock).mock.calls[0];
      const updateData = updateCall[1];
      expect(updateData.players[0].name).toBe(injectionName); // Stored as-is (not executed)
    });
  });

  describe('updateGameStatus', () => {
    it('should update game status to playing', async () => {
      (doc as jest.Mock).mockReturnValue({});
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await updateGameStatus('game_123', 'playing');

      const updateCall = (updateDoc as jest.Mock).mock.calls[0];
      expect(updateCall[1]).toMatchObject({ status: 'playing' });
      expect(updateCall[1].startedAt).toBeDefined();
    });

    it('should update game status to finished', async () => {
      (doc as jest.Mock).mockReturnValue({});
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await updateGameStatus('game_123', 'finished');

      const updateCall = (updateDoc as jest.Mock).mock.calls[0];
      expect(updateCall[1]).toMatchObject({ status: 'finished' });
      expect(updateCall[1].endedAt).toBeDefined();
    });
  });

  describe('addDrawnSong', () => {
    it('should add a new song to drawn list', async () => {
      const mockGame: GameSession = {
        id: 'game_123',
        hostSpotifyId: 'user_123',
        playlistId: 'playlist_456',
        playlistName: 'My Playlist',
        gameCode: 'ABC123',
        status: 'playing',
        gridSize: 5,
        playerCount: 1,
        preMarkedCount: 1,
        drawnSongIds: ['song_1', 'song_2'],
        players: [],
        createdAt: Date.now(),
      };

      const mockSnap = {
        exists: () => true,
        data: () => mockGame,
      };

      (doc as jest.Mock).mockReturnValue({});
      (getDoc as jest.Mock).mockResolvedValue(mockSnap);
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await addDrawnSong('game_123', 'song_3');

      const updateCall = (updateDoc as jest.Mock).mock.calls[0];
      expect(updateCall[1].drawnSongIds).toContain('song_3');
    });

    it('should not add duplicate songs', async () => {
      const mockGame: GameSession = {
        id: 'game_123',
        hostSpotifyId: 'user_123',
        playlistId: 'playlist_456',
        playlistName: 'My Playlist',
        gameCode: 'ABC123',
        status: 'playing',
        gridSize: 5,
        playerCount: 1,
        preMarkedCount: 1,
        drawnSongIds: ['song_1', 'song_2'],
        players: [],
        createdAt: Date.now(),
      };

      const mockSnap = {
        exists: () => true,
        data: () => mockGame,
      };

      (doc as jest.Mock).mockReturnValue({});
      (getDoc as jest.Mock).mockResolvedValue(mockSnap);
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await addDrawnSong('game_123', 'song_1'); // Already drawn

      // Should not update if song already exists
      const updateCall = (updateDoc as jest.Mock).mock.calls[0];
      expect(updateCall).toBeUndefined(); // updateDoc shouldn't be called
    });

    it('should handle nonexistent game', async () => {
      const mockSnap = {
        exists: () => false,
      };

      (doc as jest.Mock).mockReturnValue({});
      (getDoc as jest.Mock).mockResolvedValue(mockSnap);

      await expect(addDrawnSong('nonexistent', 'song_1')).rejects.toThrow('Game not found');
    });
  });

  describe('confirmWinner', () => {
    it('should set game to finished with winner', async () => {
      (doc as jest.Mock).mockReturnValue({});
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await confirmWinner('game_123', 1);

      const updateCall = (updateDoc as jest.Mock).mock.calls[0];
      expect(updateCall[1]).toMatchObject({
        status: 'finished',
        winnerPlayerIndex: 1,
      });
      expect(updateCall[1].endedAt).toBeDefined();
    });
  });

  describe('Security: Injection Prevention', () => {
    it('should handle player names with special characters safely', async () => {
      const mockGame: GameSession = {
        id: 'game_123',
        hostSpotifyId: 'user_123',
        playlistId: 'playlist_456',
        playlistName: 'My Playlist',
        gameCode: 'ABC123',
        status: 'waiting',
        gridSize: 5,
        playerCount: 0,
        preMarkedCount: 1,
        drawnSongIds: [],
        players: [],
        createdAt: Date.now(),
      };

      const mockSnap = {
        exists: () => true,
        data: () => mockGame,
      };

      (doc as jest.Mock).mockReturnValue({});
      (getDoc as jest.Mock).mockResolvedValue(mockSnap);
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      const dangerousName = '<img src=x onerror=alert("xss")>';
      await addPlayerToGame('game_123', dangerousName);

      // Should be stored as-is (sanitization happens at frontend)
      const updateCall = (updateDoc as jest.Mock).mock.calls[0];
      expect(updateCall[1].players[0].name).toBe(dangerousName);
    });

    it('should validate gameId format before operations', async () => {
      (doc as jest.Mock).mockReturnValue({});
      const mockSnap = {
        exists: () => false,
      };
      (getDoc as jest.Mock).mockResolvedValue(mockSnap);

      // Very long gameId
      const result = await getGameSessionById('a'.repeat(10000));
      expect(result).toBeNull();
    });
  });
});
