'use client'

import { useEffect, useState, useRef } from 'react';
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
  const [overlayTrack, setOverlayTrack] = useState<SpotifyTrack | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdFired = useRef(false);

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

    const fetchTracks = async () => {
      try {
        const res = await fetch(`/api/games/${gameId}/tracks`);
        if (!res.ok) throw new Error();
        const { tracks: fetchedTracks } = await res.json();
        setTracks(fetchedTracks);

        const carton = generateOnlineCard(
          data.playerIndex,
          fetchedTracks,
          data.gridSize,
          data.preMarkedCount,
          gameId
        );
        setCarton(carton);

        const markedKey = `carton_marked_${gameId}_${data.playerIndex}`;
        const marked = localStorage.getItem(markedKey);
        if (marked) setMarkedCells(new Set(JSON.parse(marked)));

        setLoading(false);
      } catch {
        setError('Error al cargar el cartón');
        setLoading(false);
      }
    };

    fetchTracks();
  }, [gameId]);

  const handleToggleCell = (cellIndex: number) => {
    if (!playerData) return;
    const newMarked = new Set(markedCells);
    if (newMarked.has(cellIndex)) newMarked.delete(cellIndex);
    else newMarked.add(cellIndex);
    setMarkedCells(newMarked);
    const markedKey = `carton_marked_${gameId}_${playerData.playerIndex}`;
    localStorage.setItem(markedKey, JSON.stringify(Array.from(newMarked)));
  };

  const handlePointerDown = (track: SpotifyTrack | null, _cellIndex: number) => {
    holdFired.current = false;
    holdTimer.current = setTimeout(() => {
      holdFired.current = true;
      if (track) setOverlayTrack(track);
    }, 500);
  };

  const handlePointerUp = (cellIndex: number) => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    if (!holdFired.current && gameState?.status !== 'finished') {
      handleToggleCell(cellIndex);
    }
  };

  const handlePointerLeave = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
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
          <Link href="/join" className="text-[#1DB954] hover:text-[#1aa34a]">Volver</Link>
        </div>
      </main>
    );
  }

  const drawnSongs = gameState?.drawnSongIds ?? [];
  const cols = carton.grid[0].length;

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-2 py-4">
      {/* Fullscreen overlay on tap-and-hold */}
      {overlayTrack && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-95 flex flex-col items-center justify-center px-8 cursor-pointer"
          onClick={() => setOverlayTrack(null)}
        >
          {overlayTrack.album?.images?.[0]?.url && (
            <img
              src={overlayTrack.album.images[0].url}
              alt={overlayTrack.name}
              className="w-48 h-48 rounded-lg mb-8 object-cover"
            />
          )}
          <p className="text-white text-3xl font-bold text-center mb-4">{overlayTrack.name}</p>
          <p className="text-[#a3a3a3] text-xl text-center">{overlayTrack.artists?.[0]?.name}</p>
          <p className="text-[#606060] text-sm mt-12">Toca para cerrar</p>
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[#a3a3a3] text-xs">Código: <span className="text-white font-mono">{playerData.gameCode}</span></p>
            <h1 className="text-xl font-bold text-white">{playerData.playerName}</h1>
          </div>
          <p className="text-[#a3a3a3] text-xs">{drawnSongs.length} canciones</p>
        </div>

        {gameState?.status === 'finished' && (
          <div className="bg-green-900 bg-opacity-30 border border-green-500 text-green-200 px-4 py-3 rounded-lg mb-4 text-center font-bold">
            ¡El juego ha terminado!
          </div>
        )}

        {/* Cartón — full width, max visible */}
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {carton.grid.flat().map((track, idx) => (
            <button
              key={idx}
              onPointerDown={() => handlePointerDown(track, idx)}
              onPointerUp={() => handlePointerUp(idx)}
              onPointerLeave={handlePointerLeave}
              disabled={gameState?.status === 'finished'}
              style={{ touchAction: 'none' }}
              className={`aspect-square p-1 rounded text-center flex flex-col items-center justify-center select-none transition-colors ${
                markedCells.has(idx)
                  ? 'bg-[#1DB954] text-black'
                  : 'bg-[#282828] text-white hover:bg-[#333333]'
              } ${gameState?.status === 'finished' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {track ? (
                <>
                  <span className="font-bold text-[0.6rem] leading-tight line-clamp-2">{track.name}</span>
                  <span className={`text-[0.5rem] leading-tight line-clamp-1 mt-0.5 ${markedCells.has(idx) ? 'text-black opacity-70' : 'text-[#a3a3a3]'}`}>
                    {track.artists?.[0]?.name}
                  </span>
                </>
              ) : (
                <span className="text-[#606060] text-xs font-bold">✦</span>
              )}
            </button>
          ))}
        </div>

        {/* Recently drawn songs — compact list below cartón */}
        {drawnSongs.length > 0 && (
          <div className="mt-4">
            <p className="text-[#a3a3a3] text-xs mb-2">Últimas canciones</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {[...drawnSongs].reverse().map((songId) => {
                const track = tracks.find(t => t.id === songId);
                return (
                  <div key={songId} className="flex items-center gap-2 py-1 border-b border-[#282828]">
                    <div>
                      <p className="text-white text-xs font-semibold line-clamp-1">{track?.name ?? songId}</p>
                      <p className="text-[#a3a3a3] text-[0.6rem] line-clamp-1">{track?.artists?.[0]?.name}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
