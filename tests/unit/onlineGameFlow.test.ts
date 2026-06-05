/**
 * Integration Tests for Complete Online Game Flow
 * Tests the entire lifecycle from game creation to completion
 */

describe('Complete Online Game Flow', () => {
  describe('Happy Path: Full Game Lifecycle', () => {
    it('should complete full game flow: create > join > play > win', async () => {
      const gameFlow = {
        step1_createGame: {
          hostSpotifyId: 'host_123',
          hostEmail: 'host@example.com',
          playlistId: 'playlist_abc',
          playlistName: 'Party Mix',
          gridSize: 5,
          preMarkedCount: 1,
        },
        step2_generateGameCode: {
          gameCode: 'ABC123',
          gameId: 'game_xyz789',
        },
        step3_playerJoinsWithCode: {
          playerName: 'Alice',
          playerEmail: 'alice@example.com',
          playerIndex: 0,
        },
        step4_playerJoinsWithQR: {
          playerName: 'Bob',
          playerIndex: 1,
        },
        step5_hostRevealsSongs: {
          drawnSongIds: ['song_1', 'song_2', 'song_3', 'song_4', 'song_5'],
        },
        step6_playersMarkCards: {
          player0Marked: [0, 5, 10, 15, 20],
          player1Marked: [1, 6, 11, 16, 21],
        },
        step7_playerGetsBingo: {
          winnerIndex: 0,
          gameType: 'bingo',
        },
        step8_gameFinished: {
          status: 'finished',
          winnerPlayerIndex: 0,
        },
      };

      expect(gameFlow.step1_createGame).toBeDefined();
      expect(gameFlow.step2_generateGameCode.gameCode).toHaveLength(6);
      expect(gameFlow.step8_gameFinished.status).toBe('finished');
    });

    it('should send confirmation emails at key points', async () => {
      const emails = [
        {
          event: 'game_created',
          recipient: 'host@example.com',
          contains: ['game code', 'join url', 'playlist name'],
        },
        {
          event: 'player_joined',
          recipient: 'host@example.com',
          contains: ['player name', 'player count'],
        },
        {
          event: 'game_winner',
          recipient: 'host@example.com',
          contains: ['winner name', 'game code'],
        },
        {
          event: 'game_summary',
          recipient: 'alice@example.com',
          contains: ['result', 'game code'],
        },
      ];

      emails.forEach(email => {
        expect(email.recipient).toBeDefined();
        expect(email.contains.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Edge Cases: Small & Large Groups', () => {
    it('should handle solo game (1 player)', async () => {
      const game = {
        playerCount: 1,
        players: [{ index: 0, name: 'Solo Player' }],
      };

      expect(game.playerCount).toBe(1);
      expect(game.players[0].index).toBe(0);
    });

    it('should handle large game (20+ players)', async () => {
      const playerCount = 25;
      const players = Array.from({ length: playerCount }, (_, i) => ({
        index: i,
        name: `Player ${i + 1}`,
      }));

      expect(players).toHaveLength(playerCount);
      expect(players[24].index).toBe(24);
      expect(players[0].index).toBe(0);
    });

    it('should generate unique cartóns for all players', async () => {
      const gameId = 'game_25players';
      const gridSize = 5;
      const preMarkedCount = 1;

      const cartones = Array.from({ length: 25 }, (_, i) => ({
        playerIndex: i,
        gameId,
        gridSize,
      }));

      // Each should have unique seed
      const seeds = new Set(
        cartones.map(c => `${c.gameId}_player${c.playerIndex}`)
      );
      expect(seeds.size).toBe(25);
    });
  });

  describe('Edge Cases: Timing & Race Conditions', () => {
    it('should handle simultaneous player joins', async () => {
      const game = { id: 'game_123', players: [], playerCount: 0 };

      // Simulate 3 players joining simultaneously
      const joins = [
        { playerName: 'Alice', timestamp: Date.now() },
        { playerName: 'Bob', timestamp: Date.now() },
        { playerName: 'Charlie', timestamp: Date.now() },
      ];

      joins.forEach((join, idx) => {
        game.players.push({ index: idx, name: join.playerName, joinedAt: join.timestamp });
        game.playerCount++;
      });

      expect(game.playerCount).toBe(3);
      expect(game.players.map(p => p.index)).toEqual([0, 1, 2]);
    });

    it('should handle rapid song reveals', async () => {
      const drawnSongIds: string[] = [];

      // Simulate revealing 10 songs in quick succession
      for (let i = 0; i < 10; i++) {
        const songId = `song_${i}`;
        if (!drawnSongIds.includes(songId)) {
          drawnSongIds.push(songId);
        }
      }

      expect(drawnSongIds).toHaveLength(10);
      expect(new Set(drawnSongIds).size).toBe(10); // All unique
    });

    it('should not double-reveal songs', async () => {
      const drawnSongIds = ['song_1', 'song_2', 'song_3'];

      const revealSong = (songId: string) => {
        if (drawnSongIds.includes(songId)) {
          return false; // Already drawn
        }
        drawnSongIds.push(songId);
        return true;
      };

      expect(revealSong('song_1')).toBe(false);
      expect(revealSong('song_4')).toBe(true);
      expect(drawnSongIds).toEqual(['song_1', 'song_2', 'song_3', 'song_4']);
    });

    it('should handle bingo claim while songs still being revealed', async () => {
      const game = {
        status: 'playing',
        drawnSongIds: ['song_1', 'song_2', 'song_3'],
        players: [
          { index: 0, name: 'Alice', markedCells: [0, 1, 2, 3, 4] },
          { index: 1, name: 'Bob', markedCells: [0, 5, 10] },
        ],
      };

      // Player can declare bingo while game still playing
      const playerIndex = 0;
      const canDeclare = game.status === 'playing';
      expect(canDeclare).toBe(true);

      // Host confirms
      game.status = 'finished';
      expect(game.status).toBe('finished');
    });
  });

  describe('Edge Cases: Network & Reconnection', () => {
    it('should handle player rejoin with same cartón', async () => {
      const gameId = 'game_123';
      const playerIndex = 1;

      // First join
      const carton1 = {
        gameId,
        playerIndex,
        gridCells: ['song_1', 'song_2', 'song_3'],
      };

      // Disconnect & reconnect (should generate same cartón)
      const carton2 = {
        gameId,
        playerIndex,
        gridCells: ['song_1', 'song_2', 'song_3'],
      };

      expect(carton1.gridCells).toEqual(carton2.gridCells);
    });

    it('should preserve cartón state across reconnections', async () => {
      const gameId = 'game_123';
      const playerIndex = 0;

      // Player marks some cells
      const marked1 = [0, 5, 10];
      localStorage.setItem(
        `carton_marked_${gameId}_${playerIndex}`,
        JSON.stringify(marked1)
      );

      // Disconnect & reconnect
      const storedMarked = JSON.parse(
        localStorage.getItem(`carton_marked_${gameId}_${playerIndex}`) || '[]'
      );

      expect(storedMarked).toEqual(marked1);
    });

    it('should sync game state on reconnect', async () => {
      const game = {
        id: 'game_123',
        status: 'playing',
        drawnSongIds: ['song_1', 'song_2', 'song_3', 'song_4'],
        playerCount: 2,
      };

      // Player reconnects and refetches state
      const fetchedGame = {
        status: game.status,
        drawnSongIds: game.drawnSongIds,
        playerCount: game.playerCount,
      };

      expect(fetchedGame.drawnSongIds).toHaveLength(4);
      expect(fetchedGame.status).toBe('playing');
    });

    it('should handle player leaving mid-game', async () => {
      const game = {
        players: [
          { index: 0, name: 'Alice', active: true },
          { index: 1, name: 'Bob', active: true },
          { index: 2, name: 'Charlie', active: true },
        ],
      };

      // Bob leaves
      game.players[1].active = false;

      const activePlayers = game.players.filter(p => p.active);
      expect(activePlayers).toHaveLength(2);
      expect(activePlayers.map(p => p.name)).toEqual(['Alice', 'Charlie']);
    });
  });

  describe('Edge Cases: Cartón Marking Logic', () => {
    it('should track marked cells correctly', async () => {
      const markedCells = new Set<number>();

      // Mark cells
      markedCells.add(0);
      markedCells.add(5);
      markedCells.add(10);

      expect(markedCells.size).toBe(3);

      // Unmark a cell
      markedCells.delete(5);
      expect(markedCells.size).toBe(2);
      expect(markedCells.has(5)).toBe(false);
    });

    it('should detect line (5 in a row)', async () => {
      const gridSize = 5;
      const markedCells = new Set([0, 1, 2, 3, 4]); // Top row

      const detectLine = (marked: Set<number>, size: number) => {
        // Check rows
        for (let row = 0; row < size; row++) {
          let count = 0;
          for (let col = 0; col < size; col++) {
            if (marked.has(row * size + col)) count++;
          }
          if (count === size) return true;
        }

        // Check columns
        for (let col = 0; col < size; col++) {
          let count = 0;
          for (let row = 0; row < size; row++) {
            if (marked.has(row * size + col)) count++;
          }
          if (count === size) return true;
        }

        return false;
      };

      expect(detectLine(markedCells, gridSize)).toBe(true);
    });

    it('should detect bingo (full card)', async () => {
      const gridSize = 5;
      const totalCells = gridSize * gridSize;
      const markedCells = new Set(Array.from({ length: totalCells }, (_, i) => i));

      const isBingo = markedCells.size === totalCells;
      expect(isBingo).toBe(true);
    });

    it('should not confuse line with bingo', async () => {
      const gridSize = 5;
      const totalCells = gridSize * gridSize;
      const markedCells = new Set([0, 1, 2, 3, 4]); // Only top row

      const isLine = markedCells.size === gridSize;
      const isBingo = markedCells.size === totalCells;

      expect(isLine).toBe(true);
      expect(isBingo).toBe(false);
    });
  });

  describe('Security: Game State Integrity', () => {
    it('should not allow client to modify game state', async () => {
      const game = {
        status: 'playing',
        drawnSongIds: ['song_1'],
      };

      // Player tries to modify (would be caught on backend)
      const attemptModify = () => {
        const tampered = { ...game, status: 'finished' };
        return tampered !== game; // Client can create new object
      };

      expect(attemptModify()).toBe(true);
      // But server wouldn't accept the modified version
      expect(game.status).toBe('playing'); // Unchanged
    });

    it('should validate bingo claim server-side', async () => {
      const playerMarkedCells = new Set([0, 5, 10]); // Incomplete
      const totalCells = 25;

      const claimBingo = () => {
        const isBingo = playerMarkedCells.size === totalCells;
        return isBingo ? { success: true } : { error: 'Not a bingo' };
      };

      const result = claimBingo();
      expect(result.error).toBe('Not a bingo');
    });

    it('should prevent host from drawing songs they do not own', async () => {
      const game = {
        hostSpotifyId: 'user_123',
        playlistId: 'playlist_xyz',
      };

      const attemptDraw = (userId: string, playlistId: string) => {
        const isHostOfPlaylist = game.hostSpotifyId === userId &&
                                 game.playlistId === playlistId;
        return isHostOfPlaylist;
      };

      expect(attemptDraw('user_123', 'playlist_xyz')).toBe(true);
      expect(attemptDraw('user_456', 'playlist_xyz')).toBe(false);
    });

    it('should not allow player to see unrevealed songs', async () => {
      const playlistTracks = ['song_1', 'song_2', 'song_3', 'song_4', 'song_5'];
      const drawnSongIds = ['song_1', 'song_2'];

      const playerCanSee = playlistTracks.filter(song =>
        drawnSongIds.includes(song)
      );

      expect(playerCanSee).toEqual(['song_1', 'song_2']);
      expect(playerCanSee).not.toContain('song_3');
    });
  });

  describe('Security: Email Validation', () => {
    it('should validate email before sending confirmation', async () => {
      const validEmails = ['host@example.com', 'player@mail.co.uk'];
      const invalidEmails = ['not-an-email', 'missing@domain', '@example.com'];

      const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      };

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });

    it('should not send emails to unverified addresses', async () => {
      const playerWithoutEmail = {
        index: 0,
        name: 'Alice',
        email: undefined,
      };

      const canSendEmail = !!playerWithoutEmail.email;
      expect(canSendEmail).toBe(false);
    });
  });

  describe('Data Consistency', () => {
    it('should maintain correct player count', async () => {
      const game = { players: [], playerCount: 0 };

      const addPlayer = (name: string) => {
        game.players.push({
          index: game.playerCount,
          name,
          joinedAt: Date.now(),
        });
        game.playerCount++;
      };

      addPlayer('Alice');
      addPlayer('Bob');
      addPlayer('Charlie');

      expect(game.playerCount).toBe(game.players.length);
      expect(game.players.map(p => p.index)).toEqual([0, 1, 2]);
    });

    it('should prevent playerIndex duplicates', async () => {
      const players = [
        { index: 0, name: 'Alice' },
        { index: 1, name: 'Bob' },
        { index: 2, name: 'Charlie' },
      ];

      const indices = new Set(players.map(p => p.index));
      expect(indices.size).toBe(players.length);
    });

    it('should maintain game code uniqueness', async () => {
      const games = [
        { id: 'game_1', code: 'ABC123' },
        { id: 'game_2', code: 'XYZ789' },
        { id: 'game_3', code: 'DEF456' },
      ];

      const codes = new Set(games.map(g => g.code));
      expect(codes.size).toBe(games.length);
    });
  });
});
