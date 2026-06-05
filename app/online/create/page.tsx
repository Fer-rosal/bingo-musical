'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';
import type { SpotifyPlaylist } from '@/types/bingo';

type Step = 'loading' | 'pick-playlist' | 'config' | 'creating' | 'created';

interface GameSessionCreated {
  id: string;
  gameCode: string;
  playlistName: string;
}

export default function CreateOnlineGamePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('loading');
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylist | null>(null);
  const [gridSize, setGridSize] = useState<4 | 5>(5);
  const [preMarkedCount, setPreMarkedCount] = useState(0);
  const [error, setError] = useState('');
  const [createdGame, setCreatedGame] = useState<GameSessionCreated | null>(null);
  const [hostEmail, setHostEmail] = useState('');
  const [spotifyId, setSpotifyId] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/playlists');
        if (res.status === 401) {
          router.push('/api/auth/login');
          return;
        }
        if (!res.ok) throw new Error();
        const { playlists } = await res.json();
        setPlaylists(playlists);
        setStep('pick-playlist');

        // Get user profile for email
        const profileRes = await fetch('/api/auth/profile');
        if (profileRes.ok) {
          const profile = await profileRes.json();
          setHostEmail(profile.email);
          setSpotifyId(profile.id);
        }
      } catch {
        setError('No se pudo obtener tus playlists');
        setStep('pick-playlist');
      }
    };
    fetchData();
  }, [router]);

  const handleSelectPlaylist = (playlist: SpotifyPlaylist) => {
    setSelectedPlaylist(playlist);
    setStep('config');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlaylist) return;

    setStep('creating');
    setError('');

    try {
      const response = await fetch('/api/games/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostSpotifyId: spotifyId,
          hostEmail,
          playlistId: selectedPlaylist.id,
          playlistName: selectedPlaylist.name,
          playlistImageUrl: selectedPlaylist.images?.[0]?.url,
          gridSize,
          preMarkedCount,
        }),
      });

      if (!response.ok) {
        setError('Error al crear el juego');
        setStep('config');
        return;
      }

      const game = await response.json();
      setCreatedGame(game);
      setStep('created');
    } catch (err) {
      setError('Error al crear el juego');
      setStep('config');
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6 py-8">
      <div className="max-w-2xl w-full">
        {step !== 'created' && (
          <Link href="/dashboard" className="text-[#a3a3a3] hover:text-white mb-8 block text-sm">
            ← Volver
          </Link>
        )}

        {step === 'loading' && (
          <div className="text-center">
            <p className="text-[#a3a3a3]">Cargando...</p>
          </div>
        )}

        {(step === 'pick-playlist' || step === 'config') && (
          <>
            {step === 'pick-playlist' && (
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Crear juego online</h1>
                <p className="text-[#a3a3a3] mb-8">Selecciona una playlist para el juego</p>

                {error && (
                  <div className="bg-red-900 bg-opacity-30 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {playlists.map((playlist) => (
                    <button
                      key={playlist.id}
                      onClick={() => handleSelectPlaylist(playlist)}
                      className="p-4 bg-[#282828] hover:bg-[#333333] border border-[#404040] rounded-lg text-left transition-all duration-200 group"
                    >
                      {playlist.images?.[0] && (
                        <img
                          src={playlist.images[0].url}
                          alt={playlist.name}
                          className="w-full h-32 object-cover rounded mb-3"
                        />
                      )}
                      <h3 className="text-white font-bold group-hover:text-[#1DB954]">{playlist.name}</h3>
                      <p className="text-[#a3a3a3] text-sm">{playlist.tracks?.total || 0} canciones</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 'config' && selectedPlaylist && (
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Configurar juego</h1>

                <form onSubmit={handleCreate} className="space-y-6 max-w-md">
                  <div className="bg-[#282828] border border-[#404040] rounded-lg p-4 mb-6">
                    {selectedPlaylist.images?.[0] && (
                      <img
                        src={selectedPlaylist.images[0].url}
                        alt={selectedPlaylist.name}
                        className="w-20 h-20 rounded mb-3"
                      />
                    )}
                    <h3 className="text-white font-bold">{selectedPlaylist.name}</h3>
                    <p className="text-[#a3a3a3] text-sm">{selectedPlaylist.tracks?.total || 0} canciones</p>
                  </div>

                  <div>
                    <label className="block text-white text-sm mb-2">Tamaño del cartón</label>
                    <div className="flex gap-4">
                      {[4, 5].map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setGridSize(size as 4 | 5)}
                          className={`px-4 py-2 rounded-lg font-bold transition-all ${
                            gridSize === size
                              ? 'bg-[#1DB954] text-black'
                              : 'bg-[#282828] text-white border border-[#404040]'
                          }`}
                        >
                          {size}x{size}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-white text-sm mb-2">
                      Casillas pre-marcadas: {preMarkedCount}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max={Math.floor((gridSize * gridSize) / 2)}
                      value={preMarkedCount}
                      onChange={(e) => setPreMarkedCount(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-900 bg-opacity-30 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPlaylist(null);
                        setStep('pick-playlist');
                      }}
                      className="flex-1 bg-[#282828] hover:bg-[#333333] text-white font-bold py-3 rounded-lg transition-all"
                    >
                      Atrás
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-[#1DB954] hover:bg-[#1aa34a] text-black font-bold py-3 rounded-lg transition-all"
                    >
                      Crear juego
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}

        {step === 'creating' && (
          <div className="text-center">
            <p className="text-[#a3a3a3]">Creando juego...</p>
          </div>
        )}

        {step === 'created' && createdGame && (
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-6">¡Juego creado!</h1>

            <div className="bg-white p-6 rounded-lg inline-block mb-8">
              <QRCodeSVG value={`${process.env.NEXT_PUBLIC_APP_URL}/join?code=${createdGame.gameCode}`} size={256} />
            </div>

            <div className="bg-[#282828] border border-[#404040] rounded-lg p-6 mb-8 max-w-md mx-auto">
              <p className="text-[#a3a3a3] text-sm mb-2">Código del juego</p>
              <p className="text-4xl font-mono font-bold text-[#1DB954] mb-4">{createdGame.gameCode}</p>
              <p className="text-white text-sm">Comparte este código con los otros jugadores</p>
            </div>

            <p className="text-[#a3a3a3] mb-8">
              Los jugadores pueden escanear el código QR o ingresar el código en{' '}
              <Link href="/join" className="text-[#1DB954] hover:underline">
                bingo-musical.com/join
              </Link>
            </p>

            <Link
              href={`/online/${createdGame.id}/host`}
              className="inline-block bg-[#1DB954] hover:bg-[#1aa34a] text-black font-bold px-8 py-3 rounded-lg transition-all"
            >
              Ir a la sala del host
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
