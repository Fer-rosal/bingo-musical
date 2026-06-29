'use client'

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Game {
  id: string;
  gameCode: string;
  playlistName: string;
  playlistImageUrl?: string;
  playerCount: number;
  gridSize: 4 | 5;
}

export default function JoinGamePage() {
  const router = useRouter();
  const params = useParams();
  const gameId = params.gameId as string;

  const [game, setGame] = useState<Game | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const response = await fetch(`/api/games/${gameId}`);
        if (!response.ok) {
          setError('Juego no encontrado');
          setLoading(false);
          return;
        }
        const gameData = await response.json();
        setGame(gameData);
      } catch (err) {
        setError('Error al cargar el juego');
      } finally {
        setLoading(false);
      }
    };

    fetchGame();
  }, [gameId]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setJoining(true);

    try {
      const response = await fetch(`/api/games/${gameId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName,
          email: email || undefined,
        }),
      });

      if (!response.ok) {
        setError('No se pudo unirse al juego');
        setJoining(false);
        return;
      }

      const joinData = await response.json();
      localStorage.setItem(
        `online_game_${gameId}`,
        JSON.stringify({
          playerIndex: joinData.playerIndex,
          playerName,
          gameCode: joinData.gameCode,
          playlistId: joinData.playlistId,
          gridSize: joinData.gridSize,
          preMarkedCount: joinData.preMarkedCount,
          joinedAt: Date.now(),
        })
      );

      router.push(`/online/${gameId}/player`);
    } catch (err) {
      setError('Error al unirse al juego');
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <p className="text-[#a3a3a3]">Cargando...</p>
      </main>
    );
  }

  if (!game) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-md">
          <p className="text-red-400 mb-4">{error}</p>
          <Link href="/join" className="text-[#1DB954] hover:text-[#1aa34a]">
            Volver a búsqueda
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6 py-8">
      <div className="max-w-md w-full">
        <Link href="/join" className="text-[#a3a3a3] hover:text-white mb-8 block text-sm">
          ← Volver
        </Link>

        {game.playlistImageUrl && (
          <img
            src={game.playlistImageUrl}
            alt={game.playlistName}
            className="w-32 h-32 rounded-lg mx-auto mb-6 object-cover"
          />
        )}

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {game.playlistName}
          </h1>
          <p className="text-[#a3a3a3] text-sm">
            Código: <span className="text-white font-mono">{game.gameCode}</span>
          </p>
          <p className="text-[#a3a3a3] text-sm mt-2">
            {game.playerCount} jugador{game.playerCount !== 1 ? 'es' : ''} se han unido
          </p>
        </div>

        {error && (
          <div className="bg-red-900 bg-opacity-30 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-white text-sm mb-2">Tu nombre</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Ej: María"
              className="w-full bg-[#282828] text-white px-4 py-3 rounded-lg border border-[#404040] focus:border-[#1DB954] focus:outline-none placeholder-[#606060]"
              required
            />
          </div>

          <div>
            <label className="block text-white text-sm mb-2">
              Email (opcional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full bg-[#282828] text-white px-4 py-3 rounded-lg border border-[#404040] focus:border-[#1DB954] focus:outline-none placeholder-[#606060]"
            />
          </div>

          <button
            type="submit"
            disabled={!playerName || joining}
            className="w-full bg-[#1DB954] hover:bg-[#1aa34a] disabled:bg-[#404040] text-black font-bold py-3 rounded-lg transition-all duration-200"
          >
            {joining ? 'Uniéndose...' : 'Unirme al juego'}
          </button>
        </form>
      </div>
    </main>
  );
}
