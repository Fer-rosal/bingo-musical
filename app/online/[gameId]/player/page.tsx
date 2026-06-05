'use client'

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { SpotifyTrack, BingoCard } from '@/types/bingo';
import { generateOnlineCard } from '@/utils/bingo';
import { useGameState } from '@/lib/hooks/useGameState';

interface PlayerGameData {
  playerIndex: number;
  playerName: string;
  gameCode: string;
  playlistId: string;
  gridSize: 4 | 5;
  preMarkedCount: number;
  joinedAt: number;
}

export default function PlayerGamePage() {
  const params = useParams();
  const gameId = params.gameId as string;

  const [playerData, setPlayerData] = useState<PlayerGameData | null>(null);
  const [carton, setCarton] = useState<BingoCard | null>(null);
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [markedCells, setMarkedCells] = useState<Set<number>>(new Set());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const { gameState } = useGameState(gameId);

  useEffect(() => {
    const stored = localStorage.getItem(`online_game_${gameId}`);
    if (!stored) {
      setError('Datos del juego no encontrados');
      setLoading(false);
      return;
    }

    const data = JSON.parse(stored) as PlayerGameData;
    setPlayerData(data);

    // Fetch playlist tracks to generate cartón
    const fetchTracks = async () => {
      try {
        const res = await fetch(`/api/playlists/${data.playlistId}/tracks`);
        if (!res.ok) throw new Error();
        const { tracks: fetchedTracks } = await res.json();
        setTracks(fetchedTracks);

        // Generate deterministic cartón
        const carton = generateOnlineCard(
          data.playerIndex,
          fetchedTracks,
          data.gridSize,
          data.preMarkedCount,
          gameId
        );
        setCarton(carton);

        // Load marked cells from localStorage
        const markedKey = `carton_marked_${gameId}_${data.playerIndex}`;
        const marked = localStorage.getItem(markedKey);
        if (marked) {
          setMarkedCells(new Set(JSON.parse(marked)));
        }

        setLoading(false);
      } catch {
        setError('Error al cargar el cartón');
        setLoading(false);
      }
    };

    fetchTracks();
  }, [gameId]);

  const handleToggleCell = (cellIndex: number) => {
    const newMarked = new Set(markedCells);
    if (newMarked.has(cellIndex)) {
      newMarked.delete(cellIndex);
    } else {
      newMarked.add(cellIndex);
    }
    setMarkedCells(newMarked);

    // Save to localStorage
    const markedKey = `carton_marked_${gameId}_${playerData?.playerIndex}`;
    localStorage.setItem(markedKey, JSON.stringify(Array.from(newMarked)));
  };

  if (loading || !playerData || !carton) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <p className="text-[#a3a3a3]">Cargando cartón...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-md">
          <p className="text-red-400 mb-4">{error}</p>
          <Link href="/join" className="text-[#1DB954] hover:text-[#1aa34a]">
            Volver
          </Link>
        </div>
      </main>
    );
  }

  const drawnSongs = gameState?.drawnSongIds || [];

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <p className="text-[#a3a3a3] text-sm">Código: <span className="text-white font-mono">{playerData.gameCode}</span></p>
          <h1 className="text-3xl font-bold text-white">Hola, {playerData.playerName}</h1>
          <p className="text-[#a3a3a3]">Toca las canciones que escuches</p>
        </div>

        {gameState?.status === 'finished' && (
          <div className="bg-green-900 bg-opacity-30 border border-green-500 text-green-200 px-4 py-3 rounded-lg mb-6">
            ¡El juego ha terminado!
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cartón */}
          <div className="lg:col-span-2">
            <div
              className="grid gap-2 p-4 bg-[#1a1a1a] rounded-lg"
              style={{
                gridTemplateColumns: `repeat(${carton.grid[0].length}, 1fr)`,
              }}
            >
              {carton.grid.flat().map((track, idx) => (
                <button
                  key={idx}
                  onClick={() => handleToggleCell(idx)}
                  disabled={gameState?.status === 'finished'}
                  className={`aspect-square p-2 rounded-lg text-xs text-center flex flex-col items-center justify-center transition-all ${
                    markedCells.has(idx)
                      ? 'bg-[#1DB954] text-black font-bold'
                      : 'bg-[#282828] text-white hover:bg-[#333333]'
                  } ${gameState?.status === 'finished' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {track ? (
                    <>
                      <span className="font-bold line-clamp-1">{track.name}</span>
                      <span className="text-[#a3a3a3] text-[0.65rem] line-clamp-1">
                        {track.artists?.[0]?.name}
                      </span>
                    </>
                  ) : (
                    <span className="text-[#606060]">LIBRE</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Revealed songs */}
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-white mb-4">Canciones reveladas</h2>
            <div className="flex-1 bg-[#1a1a1a] rounded-lg p-4 overflow-y-auto max-h-96">
              {drawnSongs.length === 0 ? (
                <p className="text-[#a3a3a3] text-sm">Esperando canciones...</p>
              ) : (
                <ul className="space-y-2">
                  {drawnSongs.map((songId) => {
                    const track = tracks.find(t => t.id === songId);
                    return (
                      <li key={songId} className="text-sm">
                        <p className="text-white font-semibold line-clamp-1">{track?.name || songId}</p>
                        <p className="text-[#a3a3a3] text-xs line-clamp-1">
                          {track?.artists?.[0]?.name}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {gameState?.status !== 'finished' && (
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => {/* Will implement line declaration */}}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all"
                >
                  Línea
                </button>
                <button
                  onClick={() => {/* Will implement bingo declaration */}}
                  className="w-full py-2 bg-[#1DB954] hover:bg-[#1aa34a] text-black font-bold rounded-lg transition-all"
                >
                  Bingo
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
