'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function JoinPage() {
  const router = useRouter();
  const [gameCode, setGameCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`/api/games/search?code=${gameCode}`);

      if (!response.ok) {
        setError('Juego no encontrado o ya terminado');
        setLoading(false);
        return;
      }

      const game = await response.json();
      router.push(`/online/join/${game.id}`);
    } catch (err) {
      setError('Error al buscar el juego');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6 py-8">
      <div className="max-w-md w-full">
        <Link href="/" className="text-[#a3a3a3] hover:text-white mb-8 block text-sm">
          ← Volver
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Unirme a un juego</h1>
          <p className="text-[#a3a3a3]">Escanea el código QR o ingresa el código del juego</p>
        </div>

        {error && (
          <div className="bg-red-900 bg-opacity-30 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSearch} className="space-y-4 mb-6">
          <div>
            <label className="block text-white text-sm mb-2">Código del juego (6 caracteres)</label>
            <input
              type="text"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              className="w-full bg-[#282828] text-white px-4 py-3 rounded-lg border border-[#404040] focus:border-[#1DB954] focus:outline-none placeholder-[#606060]"
            />
          </div>
          <button
            type="submit"
            disabled={gameCode.length !== 6 || loading}
            className="w-full bg-[#1DB954] hover:bg-[#1aa34a] disabled:bg-[#404040] text-black font-bold py-3 rounded-lg transition-all duration-200"
          >
            {loading ? 'Buscando...' : 'Buscar juego'}
          </button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#404040]"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-[#0a0a0a] text-[#a3a3a3]">O</span>
          </div>
        </div>

        <button
          onClick={() => setShowScanner(!showScanner)}
          className="w-full bg-white hover:bg-gray-100 text-black font-bold py-3 rounded-lg transition-all duration-200 mb-4"
        >
          {showScanner ? 'Cancelar' : 'Escanear código QR'}
        </button>

        {showScanner && (
          <div className="bg-[#1a1a1a] border border-[#404040] rounded-lg p-4 mb-4">
            <p className="text-[#a3a3a3] text-sm text-center">
              Soporte de escaneo de QR - Apunta tu cámara al código QR del host
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
