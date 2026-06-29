/**
 * useSpotifyPlayback Hook
 * Unified interface for controlling Spotify playback on both native (Android) and web
 * Provides automatic fallback from native to web if bridge fails
 */

import { useCallback, useState } from 'react';
import { getAndroidSpotifyService } from '@/lib/spotify/android-spotify-service';
import type { PlaybackError } from '@/lib/spotify/android-spotify-service';

export interface UseSpotifyPlaybackOptions {
  onFallbackToWeb?: () => void;
  onConnectionFailed?: () => void;
}

export interface UseSpotifyPlaybackReturn {
  // Playback control
  play: (trackId: string, contextUri?: string) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  skip: () => Promise<void>;

  // State
  isPlaying: boolean;
  currentTrackId?: string;
  isLoading: boolean;
  error?: string;
  isConnected: boolean;
  platform: 'android' | 'ios' | 'web';
  useNativePlayback: boolean;

  // Management
  attemptNativeConnection: () => Promise<boolean>;
  clearError: () => void;
}

export function useSpotifyPlayback(
  options: UseSpotifyPlaybackOptions = {}
): UseSpotifyPlaybackReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackId, setCurrentTrackId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [isConnected, setIsConnected] = useState(false);
  const [useNativePlayback, setUseNativePlayback] = useState(false);

  const androidService = getAndroidSpotifyService();
  const platform = androidService.getPlatform();

  /**
   * Attempt to connect to native Spotify
   * Sets up for native playback or falls back if unavailable
   */
  const attemptNativeConnection = useCallback(async (): Promise<boolean> => {
    if (!androidService.canUse()) {
      return false;
    }

    setIsLoading(true);
    setError(undefined);

    try {
      const connected = await androidService.connectToNativeSpotify();

      if (connected) {
        setIsConnected(true);
        setUseNativePlayback(true);
        return true;
      } else {
        // Spotify app not installed or connection failed
        const lastError = androidService.getLastError();
        if (lastError?.code === 'APP_NOT_INSTALLED') {
          setError('Spotify app not installed. Using web player instead.');
        } else {
          setError('Failed to connect to native Spotify. Falling back to web player.');
        }

        setIsConnected(false);
        setUseNativePlayback(false);
        options.onConnectionFailed?.();
        return false;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(`Connection error: ${message}. Using web player.`);
      setIsConnected(false);
      setUseNativePlayback(false);
      options.onConnectionFailed?.();
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [androidService, options]);

  /**
   * Play a track
   * Uses native playback if available and connected, otherwise web fallback
   */
  const play = useCallback(
    async (trackId: string, contextUri?: string) => {
      setIsLoading(true);
      setError(undefined);

      try {
        if (useNativePlayback && isConnected) {
          await androidService.playTrack(trackId, contextUri);
        }

        setCurrentTrackId(trackId);
        setIsPlaying(true);
      } catch (err) {
        const playbackError = err as PlaybackError;

        if (playbackError.shouldFallback) {
          // Connection lost - switch to web playback
          setUseNativePlayback(false);
          setIsConnected(false);
          setError('Native connection lost. Switched to web player.');
          options.onFallbackToWeb?.();

          // Still mark track as playing - web player will handle it
          setCurrentTrackId(trackId);
          setIsPlaying(true);
        } else {
          const message = playbackError.message || 'Playback failed';
          setError(message);
          setIsPlaying(false);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [androidService, useNativePlayback, isConnected, options]
  );

  /**
   * Pause playback
   */
  const pause = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);

    try {
      if (useNativePlayback && isConnected) {
        await androidService.pausePlayback();
      }

      setIsPlaying(false);
    } catch (err) {
      const playbackError = err as PlaybackError;

      if (playbackError.shouldFallback) {
        // Connection lost
        setUseNativePlayback(false);
        setIsConnected(false);
        setError('Native connection lost. Switched to web player.');
        options.onFallbackToWeb?.();
        setIsPlaying(false);
      } else {
        const message = playbackError.message || 'Pause failed';
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [androidService, useNativePlayback, isConnected, options]);

  /**
   * Resume playback
   */
  const resume = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);

    try {
      if (useNativePlayback && isConnected) {
        await androidService.resumePlayback();
      }

      setIsPlaying(true);
    } catch (err) {
      const playbackError = err as PlaybackError;

      if (playbackError.shouldFallback) {
        // Connection lost
        setUseNativePlayback(false);
        setIsConnected(false);
        setError('Native connection lost. Switched to web player.');
        options.onFallbackToWeb?.();
        setIsPlaying(true);
      } else {
        const message = playbackError.message || 'Resume failed';
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [androidService, useNativePlayback, isConnected, options]);

  /**
   * Skip to next track
   */
  const skip = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);

    try {
      if (useNativePlayback && isConnected) {
        await androidService.skipTrack();
      }
    } catch (err) {
      const playbackError = err as PlaybackError;

      if (playbackError.shouldFallback) {
        // Connection lost
        setUseNativePlayback(false);
        setIsConnected(false);
        setError('Native connection lost. Switched to web player.');
        options.onFallbackToWeb?.();
      } else {
        const message = playbackError.message || 'Skip failed';
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [androidService, useNativePlayback, isConnected, options]);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(undefined);
    androidService.clearError();
  }, [androidService]);

  return {
    play,
    pause,
    resume,
    skip,
    isPlaying,
    currentTrackId,
    isLoading,
    error,
    isConnected,
    platform,
    useNativePlayback,
    attemptNativeConnection,
    clearError,
  };
}
