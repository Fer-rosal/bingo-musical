/**
 * Android Spotify Service
 * High-level service wrapper for native Spotify playback via Capacitor
 * Handles session persistence, error handling, and fallback logic
 */

import {
  SpotifyCapacitorBridge,
  getCapacitorBridge,
  type PlatformType,
} from './capacitor-bridge';

export interface PlaybackState {
  isPlaying: boolean;
  currentTrackId?: string;
  position?: number;
  isConnected: boolean;
  platform: PlatformType;
}

export interface PlaybackError {
  code: 'NOT_CONNECTED' | 'PLAYBACK_FAILED' | 'APP_NOT_INSTALLED' | 'UNKNOWN';
  message: string;
  shouldFallback: boolean;
}

/**
 * Android Spotify Service
 * Only used when platform is Android and Spotify app is available
 */
export class AndroidSpotifyService {
  private bridge: SpotifyCapacitorBridge;
  private lastError: PlaybackError | null = null;
  private connectionAttempted: boolean = false;

  constructor() {
    this.bridge = getCapacitorBridge();
  }

  /**
   * Check if service can be used (Android + native available)
   */
  canUse(): boolean {
    return this.bridge.isAvailable();
  }

  /**
   * Get current platform
   */
  getPlatform(): PlatformType {
    return this.bridge.getPlatform();
  }

  /**
   * Attempt to connect to native Spotify
   * Returns true if successful
   */
  async connectToNativeSpotify(): Promise<boolean> {
    if (!this.canUse()) {
      return false;
    }

    this.connectionAttempted = true;

    try {
      const connected = await this.bridge.connect();

      if (!connected) {
        this.lastError = {
          code: 'APP_NOT_INSTALLED',
          message: 'Spotify app not installed on device',
          shouldFallback: true,
        };
        return false;
      }

      this.lastError = null;
      return true;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.lastError = {
        code: 'UNKNOWN',
        message: err.message,
        shouldFallback: true,
      };
      return false;
    }
  }

  /**
   * Play a track
   * Throws if connection lost; caller should handle and fallback
   */
  async playTrack(trackId: string, contextUri?: string): Promise<void> {
    if (!this.bridge.getIsConnected()) {
      throw this.createError('NOT_CONNECTED', 'Not connected to native Spotify', true);
    }

    try {
      await this.bridge.play(trackId, contextUri);
      this.lastError = null;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      if (err.message.includes('NOT_CONNECTED')) {
        this.bridge.markDisconnected();
        throw this.createError('NOT_CONNECTED', 'Connection lost to native Spotify', true);
      }

      throw this.createError('PLAYBACK_FAILED', err.message, true);
    }
  }

  /**
   * Pause playback
   */
  async pausePlayback(): Promise<void> {
    if (!this.bridge.getIsConnected()) {
      throw this.createError('NOT_CONNECTED', 'Not connected to native Spotify', true);
    }

    try {
      await this.bridge.pause();
      this.lastError = null;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      if (err.message.includes('NOT_CONNECTED')) {
        this.bridge.markDisconnected();
        throw this.createError('NOT_CONNECTED', 'Connection lost to native Spotify', true);
      }

      throw this.createError('PLAYBACK_FAILED', err.message, true);
    }
  }

  /**
   * Resume playback
   */
  async resumePlayback(): Promise<void> {
    if (!this.bridge.getIsConnected()) {
      throw this.createError('NOT_CONNECTED', 'Not connected to native Spotify', true);
    }

    try {
      await this.bridge.resume();
      this.lastError = null;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      if (err.message.includes('NOT_CONNECTED')) {
        this.bridge.markDisconnected();
        throw this.createError('NOT_CONNECTED', 'Connection lost to native Spotify', true);
      }

      throw this.createError('PLAYBACK_FAILED', err.message, true);
    }
  }

  /**
   * Skip to next track
   */
  async skipTrack(): Promise<void> {
    if (!this.bridge.getIsConnected()) {
      throw this.createError('NOT_CONNECTED', 'Not connected to native Spotify', true);
    }

    try {
      await this.bridge.skipNext();
      this.lastError = null;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      if (err.message.includes('NOT_CONNECTED')) {
        this.bridge.markDisconnected();
        throw this.createError('NOT_CONNECTED', 'Connection lost to native Spotify', true);
      }

      throw this.createError('PLAYBACK_FAILED', err.message, true);
    }
  }

  /**
   * Get current playback state
   */
  async getPlaybackState(): Promise<PlaybackState> {
    return {
      isPlaying: false,
      isConnected: this.bridge.getIsConnected(),
      platform: this.bridge.getPlatform(),
    };
  }

  /**
   * Get last error that occurred
   */
  getLastError(): PlaybackError | null {
    return this.lastError;
  }

  /**
   * Clear last error
   */
  clearError(): void {
    this.lastError = null;
  }

  /**
   * Check if connection was ever attempted
   */
  hasConnectionAttempted(): boolean {
    return this.connectionAttempted;
  }

  /**
   * Helper to create error objects
   */
  private createError(
    code: PlaybackError['code'],
    message: string,
    shouldFallback: boolean
  ): PlaybackError {
    const error: PlaybackError = {
      code,
      message,
      shouldFallback,
    };
    this.lastError = error;
    return error;
  }
}

/**
 * Singleton instance
 */
let serviceInstance: AndroidSpotifyService | null = null;

export function getAndroidSpotifyService(): AndroidSpotifyService {
  if (!serviceInstance) {
    serviceInstance = new AndroidSpotifyService();
  }
  return serviceInstance;
}
