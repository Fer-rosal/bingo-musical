'use client'

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { SpotifyTrack } from '@/types/bingo';
import { useGameState } from '@/lib/hooks/useGameState';
import { useSpotifyPlayback } from '@/lib/hooks/useSpotifyPlayback';

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

export default function HostGamePage() {
  const params = useParams();
  const gameId = params.gameId as string;

  const [gameData, setGameData] = useState<GameData | null>(null);
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [selectedSongIdx, setSelectedSongIdx] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [nativeConnectionNotified, setNativeConnectionNotified] = useState(false);

  const { gameState } = useGameState(gameId, 1000);
  const playback = useSpotifyPlayback({
    onFallbackToWeb: () => {
      setError('Conexión con Spotify nativa perdida. Usando reproductor web.');
    },
  });

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const res = await fetch(`/api/games/${gameId}`);
        if (!res.ok) throw new Error();
        const game = await res.json();
        setGameData(game);

        // Fetch tracks
        const tracksRes = await fetch(`/api/playlists/${game.playlistId}/tracks`);
        if (tracksRes.ok) {
          const { tracks } = await tracksRes.json();
          setTracks(tracks);
        }

        setLoading(false);
      } catch {
        setError('Error al cargar el juego');
        setLoading(false);
      }
    };

    fetchGame();
  }, [gameId]);

  const handleRevealSong = async () => {
    if (!tracks[selectedSongIdx]) return;

    try {
      const track = tracks[selectedSongIdx];

      // Attempt to play via native Spotify if connected, otherwise web player will handle it
      if (playback.useNativePlayback && playback.isConnected) {
        try {
          await playback.play(track.id);
        } catch (playbackErr) {
          console.warn('Native playback failed, fallback to web:', playbackErr);
          // Web player fallback will be handled by the service
        }
      }

      // Send song reveal to backend regardless of playback method
      const response = await fetch(`/api/games/${gameId}/draw-song`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songId: track.id }),
      });

      if (response.ok) {
        setSelectedSongIdx((prev) => (prev + 1) % tracks.length);
      }
    } catch (err) {
      setError('Error al revelar canción');
    }
  };

  const handleConfirmBingo = async (playerIndex: number) => {
    try {
      const response = await fetch(`/api/games/${gameId}/confirm-bingo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerIndex,
          gameType: 'bingo',
        }),
      });

      if (response.ok) {
        setError('¡Ganador confirmado!');
      }
    } catch (err) {
      setError('Error al confirmar bingo');
    }
  };

  // Show native connection status banner if using native playback
  useEffect(() => {
    if (playback.useNativePlayback && playback.isConnected && !nativeConnectionNotified) {
      setNativeConnectionNotified(true);
    }
  }, [playback.useNativePlayback, playback.isConnected, nativeConnectionNotified]);

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

  const currentTrack = tracks[selectedSongIdx];
  const drawnCount = gameState?.drawnSongIds?.length || 0;

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard" className="text-[#a3a3a3] hover:text-white text-sm mb-4 inline-block">
            ← Volver al dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#a3a3a3] text-sm">Código: <span className="text-white font-mono">{gameData.gameCode}</span></p>
              <h1 className="text-3xl font-bold text-white">{gameData.playlistName}</h1>
            </div>
            <div className="text-right">
              <p className="text-[#a3a3a3]">{gameState?.playerCount || 0} jugadores</p>
              <p className="text-2xl font-bold text-[#1DB954]">{drawnCount}/{tracks.length}</p>
            </div>
          </div>
        </div>

        {nativeConnectionNotified && playback.useNativePlayback && playback.isConnected && (
          <div
            className="bg-green-900 bg-opacity-30 border border-green-500 text-green-200 px-4 py-3 rounded-lg mb-6"
            data-testid="host-native-spotify-indicator"
          >
            ✓ Conectado a Spotify nativo
          </div>
        )}

        {error && (
          <div className="bg-red-900 bg-opacity-30 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {gameState?.status === 'finished' && (
          <div className="bg-green-900 bg-opacity-30 border border-green-500 text-green-200 px-4 py-3 rounded-lg mb-6">
            ¡El juego ha finalizado!
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Song Reveal */}
          <div className="lg:col-span-2">
            {currentTrack && (
              <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#404040]">
                {currentTrack.album?.images?.[0]?.url && (
                  <img
                    src={currentTrack.album.images[0].url}
                    alt={currentTrack.name}
                    className="w-32 h-32 rounded mb-4 object-cover"
                  />
                )}
                <h2 className="text-2xl font-bold text-white mb-2">{currentTrack.name}</h2>
                <p className="text-[#a3a3a3] mb-4">{currentTrack.artists?.[0]?.name}</p>

                <div className="flex gap-3">
                  <button
                    onClick={handleRevealSong}
                    disabled={gameState?.status === 'finished' || playback.isLoading}
                    data-testid="host-reveal-song-btn"
                    className="flex-1 py-3 bg-[#1DB954] hover:bg-[#1aa34a] disabled:bg-[#404040] text-black font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    {playback.isLoading && <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />}
                    Revelar siguiente
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Players List */}
          <div>
            <h2 className="text-lg font-bold text-white mb-4">Jugadores</h2>
            <div className="bg-[#1a1a1a] rounded-lg p-4 max-h-96 overflow-y-auto">
              {gameState?.players && gameState.players.length > 0 ? (
                <ul className="space-y-2">
                  {gameState.players.map((player) => (
                    <li
                      key={player.index}
                      className="p-3 bg-[#282828] rounded-lg flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-white">{player.name}</p>
                        <p className="text-[#a3a3a3] text-xs">Unido hace poco</p>
                      </div>
                      {gameState.status !== 'finished' && (
                        <button
                          onClick={() => handleConfirmBingo(player.index)}
                          className="text-xs px-2 py-1 bg-[#1DB954] text-black rounded font-bold"
                        >
                          Bingo
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[#a3a3a3] text-sm">Esperando jugadores...</p>
              )}
            </div>
          </div>
        </div>

        {/* Revealed Songs */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4">Canciones reveladas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {gameState?.drawnSongIds?.map((songId) => {
              const track = tracks.find(t => t.id === songId);
              return (
                <div key={songId} className="bg-[#282828] rounded-lg p-3 border border-[#404040]">
                  {track?.album?.images?.[0]?.url && (
                    <img
                      src={track.album.images[0].url}
                      alt={track.name}
                      className="w-full h-24 object-cover rounded mb-2"
                    />
                  )}
                  <p className="font-semibold text-white text-sm line-clamp-2">{track?.name}</p>
                  <p className="text-[#a3a3a3] text-xs line-clamp-1">{track?.artists?.[0]?.name}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
