/**
 * Capacitor Spotify Bridge
 * Provides a unified interface to native Spotify SDK on Android via Capacitor
 * Falls back gracefully on web and iOS
 */

export interface CapacitorSpotifyPlugin {
  connect(options?: { spotify_uri?: string }): Promise<{ connected: boolean; spotifyVersion?: string }>;
  play(options: { trackId: string; contextUri?: string }): Promise<{ playing: boolean; trackId: string }>;
  pause(): Promise<{ paused: boolean }>;
  resume(): Promise<{ playing: boolean }>;
  skipNext(): Promise<{ skipped: boolean }>;
  getCurrentTrack(): Promise<{ trackId?: string; isPlaying: boolean; position?: number }>;
}

export interface SpotifySDKError {
  error: string;
  code?: 'PLAYBACK_FAILED' | 'NOT_CONNECTED' | 'APP_NOT_INSTALLED';
}

export type PlatformType = 'android' | 'ios' | 'web';

/**
 * Detect the current platform
 * Returns 'android' if running in Capacitor Android context
 * Returns 'ios' if running in Capacitor iOS context
 * Returns 'web' otherwise
 */
export function detectPlatform(): PlatformType {
  if (typeof window === 'undefined') return 'web';

  // Check if Capacitor is available and what platform we're on
  const cap = (window as any).Capacitor;
  if (!cap) return 'web';

  const platform = cap.getPlatform?.();
  if (platform === 'android') return 'android';
  if (platform === 'ios') return 'ios';

  return 'web';
}

/**
 * Get access to Capacitor Spotify plugin
 * Returns null if plugin is not available
 */
function getSpotifyPlugin(): CapacitorSpotifyPlugin | null {
  if (typeof window === 'undefined') return null;

  const cap = (window as any).Capacitor;
  if (!cap) return null;

  // Access registered plugin by name
  const plugin = cap.Plugins?.SpotifySDK;
  return plugin || null;
}

/**
 * Wrapper for platform-aware Spotify playback
 * On Android: delegates to Capacitor native plugin
 * On web/iOS: returns null and caller should use web player
 */
export class SpotifyCapacitorBridge {
  private plugin: CapacitorSpotifyPlugin | null = null;
  private platform: PlatformType = 'web';
  private isConnected: boolean = false;

  constructor() {
    this.platform = detectPlatform();
    if (this.platform === 'android' || this.platform === 'ios') {
      this.plugin = getSpotifyPlugin();
    }
  }

  /**
   * Check if native Spotify bridge is available
   */
  isAvailable(): boolean {
    return (this.platform === 'android' || this.platform === 'ios') && this.plugin !== null;
  }

  /**
   * Get current platform
   */
  getPlatform(): PlatformType {
    return this.platform;
  }

  /**
   * Initiate connection to native Spotify app
   * Returns true if successful, false if fallback needed
   */
  async connect(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const result = await this.plugin!.connect();
      this.isConnected = result.connected;
      return result.connected;
    } catch (error) {
      const err = error as SpotifySDKError;
      console.error('Capacitor Spotify connect failed:', err);

      // Spotify app not installed is not an error state for the bridge,
      // just means we should fall back to web
      if (err.code === 'APP_NOT_INSTALLED') {
        this.isConnected = false;
        return false;
      }

      throw error;
    }
  }

  /**
   * Play a track via native Spotify
   * Throws if not connected or if native call fails
   */
  async play(trackId: string, contextUri?: string): Promise<{ playing: boolean; trackId: string }> {
    if (!this.isConnected) {
      throw new Error('Spotify not connected');
    }

    return this.plugin!.play({ trackId, contextUri });
  }

  /**
   * Pause playback
   */
  async pause(): Promise<{ paused: boolean }> {
    if (!this.isConnected) {
      throw new Error('Spotify not connected');
    }

    return this.plugin!.pause();
  }

  /**
   * Resume paused playback
   */
  async resume(): Promise<{ playing: boolean }> {
    if (!this.isConnected) {
      throw new Error('Spotify not connected');
    }

    return this.plugin!.resume();
  }

  /**
   * Skip to next track in queue
   */
  async skipNext(): Promise<{ skipped: boolean }> {
    if (!this.isConnected) {
      throw new Error('Spotify not connected');
    }

    return this.plugin!.skipNext();
  }

  /**
   * Get current playing track info
   */
  async getCurrentTrack(): Promise<{ trackId?: string; isPlaying: boolean; position?: number }> {
    if (!this.isConnected) {
      throw new Error('Spotify not connected');
    }

    return this.plugin!.getCurrentTrack();
  }

  /**
   * Mark connection as lost
   * Called when bridge detects connection drop during game
   */
  markDisconnected(): void {
    this.isConnected = false;
  }

  /**
   * Get connection status
   */
  getIsConnected(): boolean {
    return this.isConnected;
  }
}

/**
 * Singleton instance
 */
let bridgeInstance: SpotifyCapacitorBridge | null = null;

export function getCapacitorBridge(): SpotifyCapacitorBridge {
  if (!bridgeInstance) {
    bridgeInstance = new SpotifyCapacitorBridge();
  }
  return bridgeInstance;
}
