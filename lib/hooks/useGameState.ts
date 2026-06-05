import { useEffect, useState, useCallback } from 'react';

export interface GameStateResponse {
  status: 'waiting' | 'playing' | 'finished';
  drawnSongIds: string[];
  playerCount: number;
  players: any[];
  winnerPlayerIndex?: number;
}

export function useGameState(gameId: string, pollInterval: number = 2000) {
  const [gameState, setGameState] = useState<GameStateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchGameState = useCallback(async () => {
    try {
      const response = await fetch(`/api/games/${gameId}/state`);

      if (!response.ok) {
        setError('Error al cargar el estado del juego');
        return;
      }

      const state = await response.json();
      setGameState(state);
      setError('');
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    fetchGameState();
    const interval = setInterval(fetchGameState, pollInterval);
    return () => clearInterval(interval);
  }, [fetchGameState, pollInterval]);

  return { gameState, loading, error, refetch: fetchGameState };
}
