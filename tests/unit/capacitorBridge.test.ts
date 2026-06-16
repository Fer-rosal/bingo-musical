import {
  SpotifyCapacitorBridge,
  detectPlatform,
  getCapacitorBridge,
} from '@/lib/spotify/capacitor-bridge';

// Mock Capacitor
const mockCapacitorAndroid = {
  Plugins: {
    SpotifySDK: {
      connect: jest.fn(),
      play: jest.fn(),
      pause: jest.fn(),
      resume: jest.fn(),
      skipNext: jest.fn(),
      getCurrentTrack: jest.fn(),
    },
  },
  getPlatform: jest.fn(() => 'android'),
};

const mockCapacitorWeb = {
  Plugins: {},
  getPlatform: jest.fn(() => 'web'),
};

const mockCapacitorIOS = {
  Plugins: {},
  getPlatform: jest.fn(() => 'ios'),
};

// Helper to set/clear Capacitor on the JSDOM window
const setCapacitor = (cap: any) => { (window as any).Capacitor = cap; };
const clearCapacitor = () => { delete (window as any).Capacitor; };

describe('Capacitor Spotify Bridge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearCapacitor();
  });

  afterEach(() => {
    clearCapacitor();
  });

  describe('detectPlatform', () => {
    it('should return "android" when Capacitor reports android', () => {
      setCapacitor(mockCapacitorAndroid);
      expect(detectPlatform()).toBe('android');
    });

    it('should return "ios" when Capacitor reports ios', () => {
      setCapacitor(mockCapacitorIOS);
      expect(detectPlatform()).toBe('ios');
    });

    it('should return "web" when Capacitor is not available', () => {
      clearCapacitor();
      expect(detectPlatform()).toBe('web');
    });

    it('should return "web" when Capacitor is absent (no window.Capacitor)', () => {
      clearCapacitor();
      expect(detectPlatform()).toBe('web');
    });

    it('should return "web" when getPlatform returns unknown value', () => {
      setCapacitor({ getPlatform: jest.fn(() => 'unknown') });
      expect(detectPlatform()).toBe('web');
    });
  });

  describe('SpotifyCapacitorBridge', () => {
    describe('initialization', () => {
      it('should initialize with correct platform on Android', () => {
        setCapacitor(mockCapacitorAndroid);
        const bridge = new SpotifyCapacitorBridge();
        expect(bridge.getPlatform()).toBe('android');
      });

      it('should initialize as not connected', () => {
        setCapacitor(mockCapacitorAndroid);
        const bridge = new SpotifyCapacitorBridge();
        expect(bridge.getIsConnected()).toBe(false);
      });

      it('should not have plugin on web platform', () => {
        setCapacitor(mockCapacitorWeb);
        const bridge = new SpotifyCapacitorBridge();
        expect(bridge.isAvailable()).toBe(false);
      });
    });

    describe('isAvailable', () => {
      it('should return true when on Android with plugin', () => {
        setCapacitor(mockCapacitorAndroid);
        const bridge = new SpotifyCapacitorBridge();
        expect(bridge.isAvailable()).toBe(true);
      });

      it('should return false when not on Android', () => {
        setCapacitor(mockCapacitorWeb);
        const bridge = new SpotifyCapacitorBridge();
        expect(bridge.isAvailable()).toBe(false);
      });

      it('should return false when plugin is missing', () => {
        setCapacitor({ getPlatform: jest.fn(() => 'android'), Plugins: {} });
        const bridge = new SpotifyCapacitorBridge();
        expect(bridge.isAvailable()).toBe(false);
      });
    });

    describe('connect', () => {
      it('should return false on non-Android platforms', async () => {
        setCapacitor(mockCapacitorWeb);
        const bridge = new SpotifyCapacitorBridge();
        const result = await bridge.connect();
        expect(result).toBe(false);
      });

      it('should call plugin.connect and set connected state', async () => {
        setCapacitor(mockCapacitorAndroid);
        mockCapacitorAndroid.Plugins.SpotifySDK.connect.mockResolvedValue({
          connected: true,
          spotifyVersion: '1.0',
        });
        const bridge = new SpotifyCapacitorBridge();
        const result = await bridge.connect();
        expect(result).toBe(true);
        expect(bridge.getIsConnected()).toBe(true);
      });

      it('should return false when connect returns false', async () => {
        setCapacitor(mockCapacitorAndroid);
        mockCapacitorAndroid.Plugins.SpotifySDK.connect.mockResolvedValue({
          connected: false,
        });
        const bridge = new SpotifyCapacitorBridge();
        const result = await bridge.connect();
        expect(result).toBe(false);
        expect(bridge.getIsConnected()).toBe(false);
      });

      it('should return false when app not installed (APP_NOT_INSTALLED error)', async () => {
        setCapacitor(mockCapacitorAndroid);
        mockCapacitorAndroid.Plugins.SpotifySDK.connect.mockRejectedValue({
          code: 'APP_NOT_INSTALLED',
          error: 'Spotify app is not installed',
        });
        const bridge = new SpotifyCapacitorBridge();
        const result = await bridge.connect();
        expect(result).toBe(false);
      });

      it('should throw on other errors', async () => {
        setCapacitor(mockCapacitorAndroid);
        const testError = {
          code: 'UNKNOWN_ERROR',
          error: 'Something went wrong',
        };
        mockCapacitorAndroid.Plugins.SpotifySDK.connect.mockRejectedValue(testError);
        const bridge = new SpotifyCapacitorBridge();
        await expect(bridge.connect()).rejects.toEqual(testError);
      });
    });

    describe('play', () => {
      it('should throw when not connected', async () => {
        setCapacitor(mockCapacitorAndroid);
        const bridge = new SpotifyCapacitorBridge();
        await expect(bridge.play('track123')).rejects.toThrow('Spotify not connected');
      });

      it('should play track when connected', async () => {
        setCapacitor(mockCapacitorAndroid);
        mockCapacitorAndroid.Plugins.SpotifySDK.connect.mockResolvedValue({ connected: true });
        mockCapacitorAndroid.Plugins.SpotifySDK.play.mockResolvedValue({
          playing: true,
          trackId: 'track123',
        });
        const bridge = new SpotifyCapacitorBridge();
        await bridge.connect();
        const result = await bridge.play('track123');
        expect(result.playing).toBe(true);
        expect(result.trackId).toBe('track123');
      });

      it('should pass contextUri to plugin if provided', async () => {
        setCapacitor(mockCapacitorAndroid);
        mockCapacitorAndroid.Plugins.SpotifySDK.connect.mockResolvedValue({ connected: true });
        mockCapacitorAndroid.Plugins.SpotifySDK.play.mockResolvedValue({
          playing: true,
          trackId: 'track123',
        });
        const bridge = new SpotifyCapacitorBridge();
        await bridge.connect();
        await bridge.play('track123', 'context_uri');
        expect(mockCapacitorAndroid.Plugins.SpotifySDK.play).toHaveBeenCalledWith({
          trackId: 'track123',
          contextUri: 'context_uri',
        });
      });
    });

    describe('pause', () => {
      it('should throw when not connected', async () => {
        setCapacitor(mockCapacitorAndroid);
        const bridge = new SpotifyCapacitorBridge();
        await expect(bridge.pause()).rejects.toThrow('Spotify not connected');
      });

      it('should pause when connected', async () => {
        setCapacitor(mockCapacitorAndroid);
        mockCapacitorAndroid.Plugins.SpotifySDK.connect.mockResolvedValue({ connected: true });
        mockCapacitorAndroid.Plugins.SpotifySDK.pause.mockResolvedValue({ paused: true });
        const bridge = new SpotifyCapacitorBridge();
        await bridge.connect();
        const result = await bridge.pause();
        expect(result.paused).toBe(true);
      });
    });

    describe('resume', () => {
      it('should throw when not connected', async () => {
        setCapacitor(mockCapacitorAndroid);
        const bridge = new SpotifyCapacitorBridge();
        await expect(bridge.resume()).rejects.toThrow('Spotify not connected');
      });

      it('should resume when connected', async () => {
        setCapacitor(mockCapacitorAndroid);
        mockCapacitorAndroid.Plugins.SpotifySDK.connect.mockResolvedValue({ connected: true });
        mockCapacitorAndroid.Plugins.SpotifySDK.resume.mockResolvedValue({ playing: true });
        const bridge = new SpotifyCapacitorBridge();
        await bridge.connect();
        const result = await bridge.resume();
        expect(result.playing).toBe(true);
      });
    });

    describe('skipNext', () => {
      it('should throw when not connected', async () => {
        setCapacitor(mockCapacitorAndroid);
        const bridge = new SpotifyCapacitorBridge();
        await expect(bridge.skipNext()).rejects.toThrow('Spotify not connected');
      });

      it('should skip to next track when connected', async () => {
        setCapacitor(mockCapacitorAndroid);
        mockCapacitorAndroid.Plugins.SpotifySDK.connect.mockResolvedValue({ connected: true });
        mockCapacitorAndroid.Plugins.SpotifySDK.skipNext.mockResolvedValue({ skipped: true });
        const bridge = new SpotifyCapacitorBridge();
        await bridge.connect();
        const result = await bridge.skipNext();
        expect(result.skipped).toBe(true);
      });
    });

    describe('getCurrentTrack', () => {
      it('should throw when not connected', async () => {
        setCapacitor(mockCapacitorAndroid);
        const bridge = new SpotifyCapacitorBridge();
        await expect(bridge.getCurrentTrack()).rejects.toThrow('Spotify not connected');
      });

      it('should return track info when connected', async () => {
        setCapacitor(mockCapacitorAndroid);
        mockCapacitorAndroid.Plugins.SpotifySDK.connect.mockResolvedValue({ connected: true });
        mockCapacitorAndroid.Plugins.SpotifySDK.getCurrentTrack.mockResolvedValue({
          trackId: 'track123',
          isPlaying: true,
          position: 30,
        });
        const bridge = new SpotifyCapacitorBridge();
        await bridge.connect();
        const result = await bridge.getCurrentTrack();
        expect(result.trackId).toBe('track123');
        expect(result.isPlaying).toBe(true);
      });
    });

    describe('markDisconnected', () => {
      it('should set connected state to false', async () => {
        setCapacitor(mockCapacitorAndroid);
        mockCapacitorAndroid.Plugins.SpotifySDK.connect.mockResolvedValue({ connected: true });
        const bridge = new SpotifyCapacitorBridge();
        await bridge.connect();
        expect(bridge.getIsConnected()).toBe(true);
        bridge.markDisconnected();
        expect(bridge.getIsConnected()).toBe(false);
      });

      it('should cause subsequent play calls to throw', async () => {
        setCapacitor(mockCapacitorAndroid);
        mockCapacitorAndroid.Plugins.SpotifySDK.connect.mockResolvedValue({ connected: true });
        const bridge = new SpotifyCapacitorBridge();
        await bridge.connect();
        bridge.markDisconnected();
        await expect(bridge.play('track123')).rejects.toThrow('Spotify not connected');
      });
    });
  });

  describe('getCapacitorBridge singleton', () => {
    it('should return same instance on multiple calls', () => {
      setCapacitor(mockCapacitorAndroid);
      const bridge1 = getCapacitorBridge();
      const bridge2 = getCapacitorBridge();
      expect(bridge1).toBe(bridge2);
    });
  });
});
