'use client'

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { SpotifyTrack } from '@/types/bingo';
import { useGameState } from '@/lib/hooks/useGameState';
import { shuffle } from '@/utils/bingo';
import { ReconnectModal } from '@/components/ReconnectModal';
import { detectPlatform } from '@/lib/spotify/capacitor-bridge';
import { getAndroidSpotifyService } from '@/lib/spotify/android-spotify-service';

interface GameData {
  id: string;
  hostSpotifyId: string;
  playlistId: string;
  playlistName: string;
  playlistImageUrl?: string;
  gameCode: string;
  gridSize: 4 | 5;
  preMarkedCount: number;
}

declare global {
  interface Window {
    Spotify: any
    onSpotifyWebPlaybackSDKReady: () => void
  }
}

export default function HostGamePage() {
  const params = useParams();
  const gameId = params.gameId as string;

  const [gameData, setGameData] = useState<GameData | null>(null);
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [shuffledQueue, setShuffledQueue] = useState<string[]>([]);
  const [lineaGiven, setLineaGiven] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [songSearch, setSongSearch] = useState('');

  // ── playback state (mirrors app/dashboard/game/[id]/page.tsx exactly) ──────
  const [isPlaying, setIsPlaying] = useState(false);
  const [player, setPlayer] = useState<any>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [nativeReady, setNativeReady] = useState(false);
  const [deviceError, setDeviceError] = useState('');
  const [showReconnectModal, setShowReconnectModal] = useState(false);
  const [showSpotifyHint, setShowSpotifyHint] = useState(false);
  const deviceIdRef = useRef<string | null>(null);
  // ponytail: computed once on mount; detectPlatform() returns 'web' during SSR so effects are safe
  const isAndroid = detectPlatform() === 'android';
  const isMobileBrowser = !isAndroid && typeof navigator !== 'undefined' && /Android|iPhone|iPad/i.test(navigator.userAgent);

  const { gameState, refetch } = useGameState(gameId, 1000);

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const res = await fetch(`/api/games/${gameId}`);
        if (!res.ok) throw new Error();
        const game = await res.json();
        setGameData(game);

        const tracksRes = await fetch(`/api/games/${gameId}/tracks`);
        if (tracksRes.ok) {
          const { tracks: fetched } = await tracksRes.json();
          setTracks(fetched);

          // Build shuffled bolsa, persisted so page refresh doesn't reshuffle mid-game
          const key = `bolsa_${gameId}`;
          const stored = localStorage.getItem(key);
          if (stored) {
            setShuffledQueue(JSON.parse(stored) as string[]);
          } else {
            const queue: string[] = shuffle(fetched.map((t: SpotifyTrack) => t.id));
            localStorage.setItem(key, JSON.stringify(queue));
            setShuffledQueue(queue);
          }
        }

        setLoading(false);
      } catch {
        setError('Error al cargar el juego');
        setLoading(false);
      }
    };

    fetchGame();
  }, [gameId]);

  // ── init player (identical to offline dashboard game page) ────────────────
  useEffect(() => {
    let isMounted = true;

    const initPlayer = async () => {
      if (isAndroid) {
        const service = getAndroidSpotifyService();
        if (service.canUse() && !service.getIsConnected()) {
          await service.connectToNativeSpotify();
        }
        if (isMounted && service.getIsConnected()) setNativeReady(true);
        else if (isMounted) setDeviceError('No se pudo conectar con la app de Spotify');
        return;
      }

      if (isMobileBrowser) {
        if (isMounted) setNativeReady(true);
        return;
      }

      try {
        const res = await fetch('/api/auth/token');
        if (!res.ok) return;
        const { token } = await res.json();

        window.onSpotifyWebPlaybackSDKReady = () => {
          if (!isMounted) return;

          const spotifyPlayer = new window.Spotify.Player({
            name: 'Bingo Musical',
            getOAuthToken: (callback: (token: string) => void) => callback(token),
            volume: 0.5,
          });

          spotifyPlayer.addListener('player_state_changed', (state: any) => {
            if (state) setIsPlaying(!state.paused);
          });

          spotifyPlayer.addListener('ready', ({ device_id }: { device_id: string }) => {
            deviceIdRef.current = device_id;
            if (isMounted) { setPlayer(spotifyPlayer); setPlayerReady(true); }
          });

          spotifyPlayer.addListener('not_ready', () => {
            deviceIdRef.current = null;
            if (isMounted) setPlayerReady(false);
          });

          spotifyPlayer.addListener('initialization_error', ({ message }: any) => {
            if (isMounted) setDeviceError('Error inicializando: ' + message);
          });

          spotifyPlayer.addListener('authentication_error', ({ message }: any) => {
            if (isMounted) setDeviceError('Error de autenticación: ' + message);
          });

          spotifyPlayer.connect();
        };

        const script = document.createElement('script');
        script.src = 'https://sdk.scdn.co/spotify-player.js';
        script.async = true;
        document.body.appendChild(script);
      } catch (e) {
        console.error('Failed to init Spotify player:', e);
      }
    };

    initPlayer();
    return () => {
      isMounted = false;
      if (player) player.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── play whatever was just drawn (identical to offline dashboard game page) ──
  const drawnSongIds = gameState?.drawnSongIds ?? [];
  useEffect(() => {
    const currentTrack = tracks.find(t => t.id === drawnSongIds.at(-1));
    if (!currentTrack) return;

    const playTrack = async () => {
      if (isAndroid) {
        if (!nativeReady) return;
        try {
          await getAndroidSpotifyService().playTrack(currentTrack.id);
          setIsPlaying(true);
        } catch (e) {
          console.error('Native play failed:', e);
          setDeviceError('Error al reproducir la canción');
        }
        return;
      }

      if (isMobileBrowser) {
        if (!nativeReady) return;
        try {
          const tokenRes = await fetch('/api/auth/token');
          if (tokenRes.status === 401) { setShowReconnectModal(true); return; }
          if (!tokenRes.ok) return;
          const { token } = await tokenRes.json();
          const res = await fetch('https://api.spotify.com/v1/me/player/play', {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ uris: [`spotify:track:${currentTrack.id}`] }),
          });
          if (res.status === 401) { setShowReconnectModal(true); return; }
          if (res.status === 404) { setShowSpotifyHint(true); return; }
          if (res.ok || res.status === 204) { setIsPlaying(true); setShowSpotifyHint(false); }
        } catch (e) {
          console.error('Mobile play failed:', e);
        }
        return;
      }

      if (!playerReady || !deviceIdRef.current) return;

      try {
        const tokenRes = await fetch('/api/auth/token');
        if (tokenRes.status === 401) { setShowReconnectModal(true); return; }
        if (!tokenRes.ok) return;
        const { token } = await tokenRes.json();

        const res = await fetch(
          `https://api.spotify.com/v1/me/player/play?device_id=${deviceIdRef.current}`,
          {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ uris: [`spotify:track:${currentTrack.id}`] }),
          }
        );

        if (res.status === 401) { setShowReconnectModal(true); return; }
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          console.error('Play failed:', res.status, body);
        }
      } catch (e) {
        console.error('Failed to play track:', e);
      }
    };

    playTrack();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawnSongIds.join(','), playerReady, nativeReady]);

  const togglePlayPause = async () => {
    if (isAndroid) {
      const service = getAndroidSpotifyService();
      try {
        if (isPlaying) { await service.pausePlayback(); setIsPlaying(false); }
        else { await service.resumePlayback(); setIsPlaying(true); }
      } catch (e) {
        console.error('Native toggle failed:', e);
      }
      return;
    }
    if (isMobileBrowser) {
      try {
        const tokenRes = await fetch('/api/auth/token');
        if (!tokenRes.ok) return;
        const { token } = await tokenRes.json();
        const endpoint = isPlaying
          ? 'https://api.spotify.com/v1/me/player/pause'
          : 'https://api.spotify.com/v1/me/player/play';
        await fetch(endpoint, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
        setIsPlaying(!isPlaying);
      } catch (e) {
        console.error('Mobile toggle failed:', e);
      }
      return;
    }
    if (!player) return;
    player.togglePlay();
  };

  const drawnCount = drawnSongIds.length;
  const nextTrackId = shuffledQueue[drawnCount];
  const currentTrack = tracks.find(t => t.id === drawnSongIds.at(-1)) ?? null;
  const hasMoreSongs = drawnCount < shuffledQueue.length;

  const revealNext = async () => {
    if (!nextTrackId) return;
    try {
      await fetch(`/api/games/${gameId}/draw-song`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songId: nextTrackId }),
      });
      await refetch();
    } catch {
      setError('Error al revelar canción');
    }
  };

  const handleLinea = async () => {
    if (isPlaying) { try { await togglePlayPause(); } catch { /* ignore */ } }
    setLineaGiven(true);
  };

  const handleBingo = async () => {
    if (isPlaying) { try { await togglePlayPause(); } catch { /* ignore */ } }
    try {
      await fetch(`/api/games/${gameId}/confirm-bingo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      await refetch();
    } catch {
      setError('Error al confirmar bingo');
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <p className="text-[#a3a3a3]" data-testid="host-page-loading">Cargando...</p>
      </main>
    );
  }

  if (!gameData) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6">
        <p className="text-red-400 mb-4">{error}</p>
      </main>
    );
  }

  const isFinished = gameState?.status === 'finished';

  const reversedDrawnIds = [...drawnSongIds].reverse();
  const filteredDrawnIds = songSearch.trim()
    ? reversedDrawnIds.filter(id => {
        const track = tracks.find(t => t.id === id);
        const q = songSearch.toLowerCase();
        return (
          track?.name.toLowerCase().includes(q) ||
          track?.artists.some(a => a.name.toLowerCase().includes(q))
        );
      })
    : reversedDrawnIds;

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-6">
      <div className="max-w-lg mx-auto">
        <Link href="/dashboard" className="text-[#a3a3a3] hover:text-white text-sm mb-4 inline-block">
          ← Volver al dashboard
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[#a3a3a3] text-sm">Código: <span className="text-white font-mono">{gameData.gameCode}</span></p>
            <h1 className="text-xl font-bold text-white">{gameData.playlistName}</h1>
          </div>
          <span className="text-[#a3a3a3] text-sm">{gameState?.playerCount ?? 0} jugadores</span>
        </div>

        {isFinished ? (
          <div className="bg-green-900 bg-opacity-30 border border-green-500 text-green-200 px-4 py-3 rounded-lg mb-6 text-center text-lg font-bold">
            ¡Bingo confirmado! El juego ha terminado.
          </div>
        ) : (
          <>
            {/* Current track card */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-3xl p-6 mb-4">
              <p className="text-xs font-semibold text-[#a3a3a3] uppercase tracking-widest mb-4">
                Canción actual
              </p>

              {currentTrack ? (
                <div>
                  <p className="text-2xl font-bold text-white leading-tight mb-1">{currentTrack.name}</p>
                  <p className="text-[#a3a3a3] mb-6">{currentTrack.artists.map(a => a.name).join(', ')}</p>

                  {deviceError && <p className="text-xs text-red-400 mb-3">{deviceError}</p>}
                  {showSpotifyHint && (
                    <p className="text-xs text-yellow-400 mb-3">
                      Abre Spotify en tu móvil y pulsa play una vez para activarlo
                    </p>
                  )}

                  {(playerReady || nativeReady) ? (
                    <button
                      onClick={togglePlayPause}
                      className="flex items-center gap-2 bg-[#1DB954] hover:bg-[#1aa34a] text-black font-bold text-sm px-5 py-2.5 rounded-full transition-all duration-150 hover:scale-105 active:scale-95"
                    >
                      {isPlaying ? (
                        <>
                          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-black"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                          Pausar
                        </>
                      ) : (
                        <>
                          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-black"><path d="M8 5v14l11-7z"/></svg>
                          Reproducir
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-[#a3a3a3] text-sm">
                      <div className="w-3 h-3 border border-[#a3a3a3] border-t-transparent rounded-full animate-spin" />
                      Cargando reproductor...
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[#a3a3a3]">Pulsa el botón para revelar la primera canción</p>
              )}
            </div>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
                <div className="h-full bg-[#1DB954] rounded-full transition-all duration-500" style={{ width: `${(drawnCount / (shuffledQueue.length || 1)) * 100}%` }} />
              </div>
              <p className="text-xs text-[#a3a3a3] mt-1 text-right">{drawnCount} / {shuffledQueue.length}</p>
            </div>

            {/* Reveal button */}
            <button
              onClick={revealNext}
              disabled={!hasMoreSongs}
              data-testid="host-reveal-song-btn"
              className="w-full py-4 bg-white hover:bg-[#f0f0f0] disabled:bg-[#1e1e1e] disabled:text-[#a3a3a3] text-black font-bold text-base rounded-2xl transition-all duration-150 hover:scale-[1.01] active:scale-[0.99] disabled:scale-100 disabled:cursor-not-allowed mb-3"
            >
              {hasMoreSongs ? (drawnCount === 0 ? '▶ Iniciar partida' : '⏭ Siguiente canción') : 'No hay más canciones'}
            </button>

            {/* Línea / Bingo buttons */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={handleLinea}
                disabled={lineaGiven}
                className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all duration-150 ${
                  lineaGiven
                    ? 'bg-[#1e1e1e] text-[#606060] cursor-not-allowed border border-[#2a2a2a]'
                    : 'bg-[#141414] hover:bg-[#1e1e1e] border border-[#2a2a2a] hover:border-yellow-500/50 text-yellow-400'
                }`}
              >
                {lineaGiven ? 'Línea ✓' : 'LÍNEA'}
              </button>
              <button
                onClick={handleBingo}
                className="flex-1 py-3 bg-[#141414] hover:bg-[#1e1e1e] border border-[#2a2a2a] hover:border-red-500/50 text-red-400 font-bold text-sm rounded-2xl transition-all duration-150"
              >
                BINGO
              </button>
            </div>
          </>
        )}

        {error && (
          <div className="bg-red-900 bg-opacity-30 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Played songs */}
        {drawnCount > 0 && (
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-[#a3a3a3] uppercase tracking-widest">
                Canciones jugadas ({drawnCount})
              </p>
              <input
                type="text"
                placeholder="Buscar..."
                value={songSearch}
                onChange={(e) => setSongSearch(e.target.value)}
                className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-2 py-1 text-xs text-[#a3a3a3] placeholder-[#555] focus:outline-none focus:border-[#1DB954] w-24"
              />
            </div>
            <ul className="space-y-2 max-h-52 overflow-y-auto">
              {filteredDrawnIds.length > 0 ? (
                filteredDrawnIds.map((trackId) => {
                  const track = tracks.find(t => t.id === trackId);
                  const isCurrent = trackId === drawnSongIds.at(-1);
                  return (
                    <li key={trackId} className={`text-sm flex items-baseline gap-2 ${isCurrent ? 'text-white' : 'text-[#a3a3a3]'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${isCurrent ? 'bg-[#1DB954]' : 'bg-[#2a2a2a]'}`} />
                      <span className={isCurrent ? 'font-semibold' : ''}>
                        {track?.name}
                        {track?.artists.length ? <span className="font-normal text-[#a3a3a3]"> — {track.artists[0].name}</span> : null}
                      </span>
                    </li>
                  );
                })
              ) : (
                <li className="text-sm text-[#555] italic">No encontrado</li>
              )}
            </ul>
          </div>
        )}
      </div>

      <ReconnectModal isOpen={showReconnectModal} onClose={() => setShowReconnectModal(false)} />
    </main>
  );
}
