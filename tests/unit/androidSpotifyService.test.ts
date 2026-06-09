import { AndroidSpotifyService, getAndroidSpotifyService } from '@/lib/spotify/android-spotify-service';
import * as CapacitorBridgeModule from '@/lib/spotify/capacitor-bridge';

// Mock the capacitor bridge
jest.mock('@/lib/spotify/capacitor-bridge', () => ({
  getCapacitorBridge: jest.fn(),
  detectPlatform: jest.fn(() => 'android'),
}));

describe('AndroidSpotifyService', () => {
  let mockBridge: any;
  let service: AndroidSpotifyService;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset module singleton
    jest.resetModules();

    mockBridge = {
      isAvailable: jest.fn(() => true),
      getPlatform: jest.fn(() => 'android'),
      getIsConnected: jest.fn(() => false),
      connect: jest.fn(),
      play: jest.fn(),
      pause: jest.fn(),
      resume: jest.fn(),
      skipNext: jest.fn(),
      markDisconnected: jest.fn(),
    };

    (CapacitorBridgeModule.getCapacitorBridge as jest.Mock).mockReturnValue(mockBridge);
    service = new AndroidSpotifyService();
  });

  describe('initialization', () => {
    it('should initialize with no errors', () => {
      expect(service.getLastError()).toBeNull();
    });

    it('should have connection not attempted', () => {
      expect(service.hasConnectionAttempted()).toBe(false);
    });

    it('should report correct platform', () => {
      expect(service.getPlatform()).toBe('android');
    });
  });

  describe('canUse', () => {
    it('should return true when bridge is available', () => {
      mockBridge.isAvailable.mockReturnValue(true);
      expect(service.canUse()).toBe(true);
    });

    it('should return false when bridge is not available', () => {
      mockBridge.isAvailable.mockReturnValue(false);
      expect(service.canUse()).toBe(false);
    });
  });

  describe('connectToNativeSpotify', () => {
    it('should return false when service cannot be used', async () => {
      mockBridge.isAvailable.mockReturnValue(false);
      const result = await service.connectToNativeSpotify();
      expect(result).toBe(false);
    });

    it('should return true on successful connection', async () => {
      mockBridge.connect.mockResolvedValue(true);
      const result = await service.connectToNativeSpotify();
      expect(result).toBe(true);
      expect(service.getLastError()).toBeNull();
      expect(service.hasConnectionAttempted()).toBe(true);
    });

    it('should return false and set error when app not installed', async () => {
      mockBridge.connect.mockResolvedValue(false);
      const result = await service.connectToNativeSpotify();
      expect(result).toBe(false);
      const error = service.getLastError();
      expect(error?.code).toBe('APP_NOT_INSTALLED');
      expect(error?.shouldFallback).toBe(true);
    });

    it('should return false and set error on exception', async () => {
      mockBridge.connect.mockRejectedValue(new Error('Bridge failed'));
      const result = await service.connectToNativeSpotify();
      expect(result).toBe(false);
      const error = service.getLastError();
      expect(error?.code).toBe('UNKNOWN');
      expect(error?.shouldFallback).toBe(true);
    });

    it('should mark connection as attempted', async () => {
      mockBridge.connect.mockResolvedValue(true);
      await service.connectToNativeSpotify();
      expect(service.hasConnectionAttempted()).toBe(true);
    });
  });

  describe('playTrack', () => {
    it('should throw NOT_CONNECTED error when not connected', async () => {
      mockBridge.getIsConnected.mockReturnValue(false);
      await expect(service.playTrack('track123')).rejects.toMatchObject({
        code: 'NOT_CONNECTED',
        shouldFallback: true,
      });
    });

    it('should play track when connected', async () => {
      mockBridge.getIsConnected.mockReturnValue(true);
      mockBridge.play.mockResolvedValue({ playing: true, trackId: 'track123' });
      await service.playTrack('track123');
      expect(mockBridge.play).toHaveBeenCalledWith('track123', undefined);
      expect(service.getLastError()).toBeNull();
    });

    it('should pass contextUri when provided', async () => {
      mockBridge.getIsConnected.mockReturnValue(true);
      mockBridge.play.mockResolvedValue({ playing: true });
      await service.playTrack('track123', 'context_uri');
      expect(mockBridge.play).toHaveBeenCalledWith('track123', 'context_uri');
    });

    it('should throw PLAYBACK_FAILED on bridge error', async () => {
      mockBridge.getIsConnected.mockReturnValue(true);
      mockBridge.play.mockRejectedValue(new Error('Bridge failed'));
      await expect(service.playTrack('track123')).rejects.toMatchObject({
        code: 'PLAYBACK_FAILED',
        shouldFallback: true,
      });
    });

    it('should detect connection loss and mark disconnected', async () => {
      mockBridge.getIsConnected.mockReturnValue(true);
      mockBridge.play.mockRejectedValue(new Error('NOT_CONNECTED'));
      await expect(service.playTrack('track123')).rejects.toMatchObject({
        code: 'NOT_CONNECTED',
        shouldFallback: true,
      });
      expect(mockBridge.markDisconnected).toHaveBeenCalled();
    });
  });

  describe('pausePlayback', () => {
    it('should throw NOT_CONNECTED error when not connected', async () => {
      mockBridge.getIsConnected.mockReturnValue(false);
      await expect(service.pausePlayback()).rejects.toMatchObject({
        code: 'NOT_CONNECTED',
      });
    });

    it('should pause when connected', async () => {
      mockBridge.getIsConnected.mockReturnValue(true);
      mockBridge.pause.mockResolvedValue({ paused: true });
      await service.pausePlayback();
      expect(mockBridge.pause).toHaveBeenCalled();
      expect(service.getLastError()).toBeNull();
    });

    it('should detect connection loss and mark disconnected', async () => {
      mockBridge.getIsConnected.mockReturnValue(true);
      mockBridge.pause.mockRejectedValue(new Error('NOT_CONNECTED'));
      await expect(service.pausePlayback()).rejects.toMatchObject({
        code: 'NOT_CONNECTED',
      });
      expect(mockBridge.markDisconnected).toHaveBeenCalled();
    });
  });

  describe('resumePlayback', () => {
    it('should throw NOT_CONNECTED error when not connected', async () => {
      mockBridge.getIsConnected.mockReturnValue(false);
      await expect(service.resumePlayback()).rejects.toMatchObject({
        code: 'NOT_CONNECTED',
      });
    });

    it('should resume when connected', async () => {
      mockBridge.getIsConnected.mockReturnValue(true);
      mockBridge.resume.mockResolvedValue({ playing: true });
      await service.resumePlayback();
      expect(mockBridge.resume).toHaveBeenCalled();
      expect(service.getLastError()).toBeNull();
    });

    it('should detect connection loss and mark disconnected', async () => {
      mockBridge.getIsConnected.mockReturnValue(true);
      mockBridge.resume.mockRejectedValue(new Error('NOT_CONNECTED'));
      await expect(service.resumePlayback()).rejects.toMatchObject({
        code: 'NOT_CONNECTED',
      });
      expect(mockBridge.markDisconnected).toHaveBeenCalled();
    });
  });

  describe('skipTrack', () => {
    it('should throw NOT_CONNECTED error when not connected', async () => {
      mockBridge.getIsConnected.mockReturnValue(false);
      await expect(service.skipTrack()).rejects.toMatchObject({
        code: 'NOT_CONNECTED',
      });
    });

    it('should skip when connected', async () => {
      mockBridge.getIsConnected.mockReturnValue(true);
      mockBridge.skipNext.mockResolvedValue({ skipped: true });
      await service.skipTrack();
      expect(mockBridge.skipNext).toHaveBeenCalled();
      expect(service.getLastError()).toBeNull();
    });

    it('should detect connection loss and mark disconnected', async () => {
      mockBridge.getIsConnected.mockReturnValue(true);
      mockBridge.skipNext.mockRejectedValue(new Error('NOT_CONNECTED'));
      await expect(service.skipTrack()).rejects.toMatchObject({
        code: 'NOT_CONNECTED',
      });
      expect(mockBridge.markDisconnected).toHaveBeenCalled();
    });
  });

  describe('getPlaybackState', () => {
    it('should return current state', async () => {
      mockBridge.getIsConnected.mockReturnValue(true);
      const state = await service.getPlaybackState();
      expect(state).toMatchObject({
        isPlaying: false,
        isConnected: true,
        platform: 'android',
      });
    });

    it('should reflect disconnected state', async () => {
      mockBridge.getIsConnected.mockReturnValue(false);
      const state = await service.getPlaybackState();
      expect(state.isConnected).toBe(false);
    });
  });

  describe('error management', () => {
    it('should clear last error', async () => {
      mockBridge.getIsConnected.mockReturnValue(false);
      try {
        await service.playTrack('track123');
      } catch {
        // Expected to fail
      }
      expect(service.getLastError()).not.toBeNull();
      service.clearError();
      expect(service.getLastError()).toBeNull();
    });

    it('should overwrite previous error', async () => {
      mockBridge.getIsConnected.mockReturnValue(false);
      try {
        await service.playTrack('track123');
      } catch {
        // Expected to fail
      }
      const firstError = service.getLastError();

      try {
        await service.pausePlayback();
      } catch {
        // Expected to fail
      }
      const secondError = service.getLastError();
      expect(firstError?.code).toBe('NOT_CONNECTED');
      expect(secondError?.code).toBe('NOT_CONNECTED');
      expect(firstError).not.toBe(secondError);
    });
  });

  describe('singleton', () => {
    it('should return same instance on multiple calls', () => {
      const service1 = getAndroidSpotifyService();
      const service2 = getAndroidSpotifyService();
      expect(service1).toBe(service2);
    });
  });
});
