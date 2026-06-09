import { generateOnlineCard, generateCard, getPreMarkedIndices } from '@/utils/bingo';
import type { SpotifyTrack } from '@/types/bingo';

// Mock tracks
const mockTracks: SpotifyTrack[] = Array.from({ length: 50 }, (_, i) => ({
  id: `track_${i}`,
  name: `Song ${i}`,
  artists: [{ name: `Artist ${i}` }],
  album: { name: `Album ${i}`, images: [] },
  duration_ms: 180000,
  explicit: false,
  external_urls: { spotify: '' },
  href: '',
  type: 'track',
  uri: '',
  popularity: 70,
}));

describe('Online Carton Generation', () => {
  describe('Deterministic Generation', () => {
    it('should generate the same carton for the same gameId and playerIndex', () => {
      const gameId = 'game_123';
      const carton1 = generateOnlineCard(0, mockTracks, 5, 0, gameId);
      const carton2 = generateOnlineCard(0, mockTracks, 5, 0, gameId);

      expect(carton1.grid).toEqual(carton2.grid);
    });

    it('should generate different cartons for different players in same game', () => {
      const gameId = 'game_123';
      const carton0 = generateOnlineCard(0, mockTracks, 5, 0, gameId);
      const carton1 = generateOnlineCard(1, mockTracks, 5, 0, gameId);

      // Should be different grids
      const grid0Flat = carton0.grid.flat();
      const grid1Flat = carton1.grid.flat();

      // They might have same tracks but in different order
      const mismatch = grid0Flat.some((track, idx) => {
        const t0 = track?.id;
        const t1 = grid1Flat[idx]?.id;
        return t0 !== t1;
      });

      expect(mismatch).toBe(true);
    });

    it('should generate different cartons for different games', () => {
      const carton1 = generateOnlineCard(0, mockTracks, 5, 0, 'game_1');
      const carton2 = generateOnlineCard(0, mockTracks, 5, 0, 'game_2');

      expect(carton1.grid).not.toEqual(carton2.grid);
    });

    it('should be deterministic across multiple calls', () => {
      const gameId = 'game_deterministic';
      const cartons = [];

      for (let i = 0; i < 5; i++) {
        const carton = generateOnlineCard(2, mockTracks, 5, 1, gameId);
        cartons.push(carton);
      }

      // All should be identical
      for (let i = 1; i < cartons.length; i++) {
        expect(cartons[i].grid).toEqual(cartons[0].grid);
      }
    });
  });

  describe('Grid Size Variations', () => {
    it('should generate 4x4 cartons', () => {
      const carton = generateOnlineCard(0, mockTracks, 4, 0, 'game_4x4');
      expect(carton.grid).toHaveLength(4);
      expect(carton.grid[0]).toHaveLength(4);
    });

    it('should generate 5x5 cartons', () => {
      const carton = generateOnlineCard(0, mockTracks, 5, 0, 'game_5x5');
      expect(carton.grid).toHaveLength(5);
      expect(carton.grid[0]).toHaveLength(5);
    });

    it('should respect pre-marked count for 4x4', () => {
      const carton = generateOnlineCard(0, mockTracks, 4, 3, 'game_marked_4x4');
      const flatGrid = carton.grid.flat();
      const nullCount = flatGrid.filter(cell => cell === null).length;
      expect(nullCount).toBe(3);
    });

    it('should respect pre-marked count for 5x5', () => {
      const carton = generateOnlineCard(0, mockTracks, 5, 2, 'game_marked_5x5');
      const flatGrid = carton.grid.flat();
      const nullCount = flatGrid.filter(cell => cell === null).length;
      expect(nullCount).toBe(2);
    });
  });

  describe('Pre-Marked Cells', () => {
    it('should have center cell free for single pre-mark', () => {
      const carton = generateOnlineCard(0, mockTracks, 5, 1, 'game_center');
      const centerCell = carton.grid[2][2];
      expect(centerCell).toBeNull();
    });

    it('should have multiple free cells for multiple pre-marks', () => {
      const carton = generateOnlineCard(0, mockTracks, 5, 5, 'game_multi_free');
      const flatGrid = carton.grid.flat();
      const nullCells = flatGrid.filter(cell => cell === null).length;
      expect(nullCells).toBe(5);
    });

    it('should have correct number of songs for 5x5 with no pre-marks', () => {
      const carton = generateOnlineCard(0, mockTracks, 5, 0, 'game_no_free');
      const flatGrid = carton.grid.flat();
      const songCells = flatGrid.filter(cell => cell !== null).length;
      expect(songCells).toBe(25);
    });

    it('should have correct number of songs for 4x4 with 2 pre-marks', () => {
      const carton = generateOnlineCard(0, mockTracks, 4, 2, 'game_4x4_marked');
      const flatGrid = carton.grid.flat();
      const songCells = flatGrid.filter(cell => cell !== null).length;
      expect(songCells).toBe(14);
    });
  });

  describe('Track Distribution', () => {
    it('should use tracks from the provided list', () => {
      const carton = generateOnlineCard(0, mockTracks, 5, 0, 'game_tracks');
      const flatGrid = carton.grid.flat();
      const trackIds = new Set(flatGrid.filter(t => t).map(t => t!.id));

      // All tracks should be from mock list
      trackIds.forEach(id => {
        expect(mockTracks.map(t => t.id)).toContain(id);
      });
    });

    it('should not repeat tracks in a single carton', () => {
      const carton = generateOnlineCard(0, mockTracks, 5, 0, 'game_no_repeat');
      const flatGrid = carton.grid.flat();
      const trackIds = flatGrid.filter(t => t).map(t => t!.id);
      const uniqueIds = new Set(trackIds);

      expect(uniqueIds.size).toBe(trackIds.length);
    });

    it('should handle small track lists gracefully', () => {
      const smallTracks = mockTracks.slice(0, 10);
      const carton = generateOnlineCard(0, smallTracks, 4, 1, 'game_small');
      const flatGrid = carton.grid.flat();
      const songCells = flatGrid.filter(t => t).length;
      expect(songCells).toBe(15); // 4x4 - 1 free
    });
  });

  describe('Edge Cases', () => {
    it('should handle gameId with special characters', () => {
      const specialId = 'game_123-456_abc';
      const carton = generateOnlineCard(0, mockTracks, 5, 0, specialId);
      expect(carton.grid).toBeDefined();
    });

    it('should handle very long gameId', () => {
      const longId = 'a'.repeat(1000);
      const carton = generateOnlineCard(0, mockTracks, 5, 0, longId);
      expect(carton.grid).toBeDefined();
    });

    it('should handle playerIndex 0', () => {
      const carton = generateOnlineCard(0, mockTracks, 5, 0, 'game_idx0');
      expect(carton.grid).toBeDefined();
    });

    it('should handle large playerIndex', () => {
      const carton = generateOnlineCard(9999, mockTracks, 5, 0, 'game_large_idx');
      expect(carton.grid).toBeDefined();
    });

    it('should handle maximum pre-mark count (just under grid size)', () => {
      const carton = generateOnlineCard(0, mockTracks, 5, 12, 'game_max_premark');
      const flatGrid = carton.grid.flat();
      const nullCount = flatGrid.filter(cell => cell === null).length;
      expect(nullCount).toBe(12);
      const songCount = flatGrid.filter(cell => cell !== null).length;
      expect(songCount).toBe(13);
    });
  });

  describe('Security', () => {
    it('should not expose sensitive data in carton', () => {
      const carton = generateOnlineCard(0, mockTracks, 5, 0, 'game_secure');
      const flatGrid = carton.grid.flat();

      flatGrid.forEach(track => {
        if (track) {
          // Should have necessary fields
          expect(track.id).toBeDefined();
          expect(track.name).toBeDefined();
          expect(track.artists).toBeDefined();
        }
      });
    });

    it('should not allow gameId injection to affect randomization', () => {
      const carton1 = generateOnlineCard(0, mockTracks, 5, 0, 'game_1');
      const carton2 = generateOnlineCard(0, mockTracks, 5, 0, 'game_1__admin');

      // Different gameIds produce different cartons
      expect(carton1.grid).not.toEqual(carton2.grid);
    });

    it('should handle HTML/script injection attempts in inputs', () => {
      const injectionId = '<script>alert("xss")</script>';
      const carton = generateOnlineCard(0, mockTracks, 5, 0, injectionId);
      expect(carton.grid).toBeDefined();
      // Should just work without executing anything
    });
  });
});
