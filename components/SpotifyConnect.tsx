'use client';

import { useState, useEffect } from 'react';
import { getAndroidSpotifyService } from '@/lib/spotify/android-spotify-service';

interface SpotifyConnectProps {
  onConnected?: (useNative: boolean) => void;
  onFailed?: () => void;
  disabled?: boolean;
  showStatus?: boolean;
}

/**
 * SpotifyConnect Component
 * Intelligently detects platform and initiates appropriate connection flow:
 * - Android + Spotify installed → native SDK via Capacitor
 * - Android + Spotify not installed → web player fallback
 * - Web/iOS → existing OAuth flow (web player)
 */
export default function SpotifyConnect({
  onConnected,
  onFailed,
  disabled = false,
  showStatus = true,
}: SpotifyConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'failed'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [useNativePlayback, setUseNativePlayback] = useState(false);

  const androidService = getAndroidSpotifyService();

  // Reset status after successful connection
  useEffect(() => {
    if (status === 'connected') {
      const timer = setTimeout(() => setStatus('idle'), 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  /**
   * Handle Spotify connection based on platform
   */
  const handleConnect = async () => {
    setIsConnecting(true);
    setStatus('connecting');
    setStatusMessage('');

    try {
      // Check if we can use native playback
      if (androidService.canUse()) {
        // Android + Capacitor available
        const connected = await androidService.connectToNativeSpotify();

        if (connected) {
          // Successfully connected to native Spotify
          setStatus('connected');
          setStatusMessage('Connected via native Spotify');
          setUseNativePlayback(true);
          onConnected?.(true);
        } else {
          // Native Spotify not available, show error/fallback message
          const error = androidService.getLastError();

          if (error?.code === 'APP_NOT_INSTALLED') {
            // Fallback to web player gracefully
            setStatus('connected');
            setStatusMessage('Spotify app not installed. Using web player.');
            setUseNativePlayback(false);
            // Still call onConnected - web player will handle playback
            onConnected?.(false);
          } else {
            // Other error - show and allow retry
            setStatus('failed');
            setStatusMessage(error?.message || 'Failed to connect');
            onFailed?.();
          }
        }
      } else {
        // Not Android or Capacitor unavailable - redirect to web OAuth flow
        setStatus('connected');
        setStatusMessage('Redirecting to Spotify login...');
        setUseNativePlayback(false);

        try {
          // Request Spotify auth via existing web flow
          const response = await fetch('/api/auth/spotify-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to start auth');
          }

          const { authUrl } = await response.json();
          onConnected?.(false);
          window.location.href = authUrl;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Auth error';
          setStatus('failed');
          setStatusMessage(message);
          onFailed?.();
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setStatus('failed');
      setStatusMessage(message);
      onFailed?.();
    } finally {
      setIsConnecting(false);
    }
  };

  const isDisabled = disabled || isConnecting || status === 'connected';
  const buttonText = (() => {
    if (isConnecting) return 'Conectando...';
    if (status === 'connected') return 'Conectado';
    if (useNativePlayback) return 'Conectar (Native)';
    return 'Conectar con Spotify';
  })();

  const statusColor = (() => {
    switch (status) {
      case 'connected':
        return 'text-green-400';
      case 'failed':
        return 'text-red-400';
      case 'connecting':
        return 'text-yellow-400';
      default:
        return 'text-[#a3a3a3]';
    }
  })();

  return (
    <div className="space-y-2">
      <button
        onClick={handleConnect}
        disabled={isDisabled}
        data-testid="spotify-connect-btn"
        className="w-full bg-[#1DB954] hover:bg-[#1aa34a] disabled:bg-[#404040] text-black font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-3"
      >
        {isConnecting && <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />}
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
        </svg>
        {buttonText}
      </button>

      {showStatus && statusMessage && (
        <div
          data-testid="spotify-connect-status"
          className={`text-sm text-center ${statusColor}`}
        >
          {statusMessage}
        </div>
      )}

      {status === 'failed' && (
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          data-testid="spotify-connect-retry-btn"
          className="w-full text-sm bg-[#282828] hover:bg-[#333333] text-[#a3a3a3] py-2 rounded-lg transition-all"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
