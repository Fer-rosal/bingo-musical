'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SpotifyPlaylist, SpotifyTrack, GameConfig, GameState, GameHistoryEntry } from '../../../types/bingo'
import { generateAllCards, generatePDF, shuffle } from '../../../utils/bingo'

const HISTORY_KEY = 'bingo_history'

type Step = 'loading' | 'pick-playlist' | 'config' | 'generating'

export default function NewGamePage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('loading')
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([])
  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylist | null>(null)
  const [playerCount, setPlayerCount] = useState(4)
  const [gridSize, setGridSize] = useState<4 | 5>(4)
  const [preMarkedCount, setPreMarkedCount] = useState(1)
  const [error, setError] = useState('')

  const minSongsRequired = gridSize * gridSize - preMarkedCount

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const res = await fetch('/api/playlists')
        if (res.status === 401) { router.push('/login'); return }
        if (!res.ok) throw new Error()
        const { playlists } = await res.json()
        setPlaylists(playlists)
        setStep('pick-playlist')
      } catch {
        setError('No se pudo obtener tus playlists')
        setStep('pick-playlist')
      }
    }
    fetchPlaylists()
  }, [router])

  const handleSelectPlaylist = (playlist: SpotifyPlaylist) => {
    setSelectedPlaylist(playlist)
    setStep('config')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlaylist) return
    setStep('generating')
    setError('')

    try {
      const res = await fetch(`/api/playlists/${selectedPlaylist.id}/tracks`)
      if (res.status === 401) { router.push('/api/auth/login'); return }
      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error || 'Error al obtener canciones')
      }

      const { tracks } = (await res.json()) as { tracks: SpotifyTrack[] }
      const minRequired = gridSize * gridSize - preMarkedCount

      if (tracks.length < minRequired) {
        setError(`Playlist con pocas canciones. Necesitas ${minRequired}, tiene ${tracks.length}.`)
        setStep('config')
        return
      }

      const config: GameConfig = {
        playlistId: selectedPlaylist.id,
        playlistName: selectedPlaylist.name,
        playerCount,
        gridSize,
        preMarkedCount,
      }

      const cards = generateAllCards(tracks, config)
      const gameId = Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
      const shuffledQueue = shuffle(tracks).map(t => t.id)

      const gameState: GameState = {
        id: gameId, config, tracks, shuffledQueue, drawnIds: [],
        status: 'playing', createdAt: new Date().toISOString(),
      }
      localStorage.setItem(`game_${gameId}`, JSON.stringify(gameState))

      const historyEntry: GameHistoryEntry = {
        id: gameId, playlistName: selectedPlaylist.name, playerCount,
        gridSize, date: new Date().toISOString(), status: 'abandoned',
      }
      const raw = localStorage.getItem(HISTORY_KEY)
      const history: GameHistoryEntry[] = raw ? JSON.parse(raw) : []
      history.push(historyEntry)
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history))

      await generatePDF(cards, config)
      router.push(`/dashboard/game/${gameId}`)
    } catch {
      setError('Error al crear la partida')
      setStep('config')
    }
  }

  if (step === 'loading') {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#a3a3a3] text-sm">Cargando playlists...</p>
        </div>
      </main>
    )
  }

  if (step === 'generating') {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin" />
          <p className="text-white font-semibold">Generando cartones...</p>
          <p className="text-[#a3a3a3] text-sm">Esto puede tomar un momento</p>
        </div>
      </main>
    )
  }

  if (step === 'pick-playlist') {
    return (
      <main className="min-h-screen bg-[#0a0a0a] px-6 py-10">
        <div className="max-w-xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#a3a3a3] hover:text-white transition mb-8 text-sm"
          >
            <span>←</span> Volver
          </button>

          <h1 className="text-3xl font-bold text-white tracking-tight mb-1">Elige una playlist</h1>
          <p className="text-[#a3a3a3] mb-8">Selecciona la playlist que se usará para el bingo</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 mb-6 text-sm">
              {error}
            </div>
          )}

          {playlists.length === 0 ? (
            <p className="text-[#a3a3a3] text-center py-16">No hay playlists disponibles</p>
          ) : (
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
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-6 py-10">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => { setStep('pick-playlist'); setSelectedPlaylist(null) }}
          className="flex items-center gap-2 text-[#a3a3a3] hover:text-white transition mb-8 text-sm"
        >
          <span>←</span> Cambiar playlist
        </button>

        <h1 className="text-3xl font-bold text-white tracking-tight mb-1">Configurar partida</h1>
        <p className="text-[#1DB954] font-medium mb-8">{selectedPlaylist?.name}</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-[#a3a3a3] uppercase tracking-wider mb-3">
                Número de jugadores
              </label>
              <input
                type="number"
                min="1"
                max="500"
                value={playerCount}
                onChange={e => setPlayerCount(parseInt(e.target.value))}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] focus:border-[#1DB954] text-white px-4 py-3 rounded-xl outline-none transition text-lg font-semibold"
              />
              <p className="text-xs text-[#a3a3a3] mt-2">
                Se necesitan al menos {minSongsRequired} canciones
              </p>
            </div>

            <div className="border-t border-[#2a2a2a] pt-5">
              <label className="block text-sm font-semibold text-[#a3a3a3] uppercase tracking-wider mb-3">
                Tamaño de grilla
              </label>
              <div className="grid grid-cols-2 gap-2">
                {([4, 5] as const).map(size => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setGridSize(size)}
                    className={`py-3 rounded-xl font-semibold text-sm transition-all ${
                      gridSize === size
                        ? 'bg-[#1DB954] text-black'
                        : 'bg-[#0a0a0a] border border-[#2a2a2a] text-[#a3a3a3] hover:border-[#1DB954]/40'
                    }`}
                  >
                    {size}×{size}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-[#2a2a2a] pt-5">
              <label className="block text-sm font-semibold text-[#a3a3a3] uppercase tracking-wider mb-1">
                Casillas pre-marcadas
              </label>
              <p className="text-xs text-[#a3a3a3] mb-3">1 = solo el centro</p>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={preMarkedCount}
                  onChange={e => setPreMarkedCount(parseInt(e.target.value))}
                  className="flex-1 accent-[#1DB954]"
                />
                <span className="text-white font-bold text-lg w-6 text-center">{preMarkedCount}</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-[#1DB954] hover:bg-[#1aa34a] text-black font-bold text-base rounded-2xl transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
          >
            Generar Cartones
          </button>
        </form>
      </div>
    </main>
  )
}
