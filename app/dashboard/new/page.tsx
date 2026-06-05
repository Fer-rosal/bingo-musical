'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SpotifyPlaylist, SpotifyTrack, GameConfig, GameState, GameHistoryEntry } from '../../../types/bingo'
import { generateAllCards, generatePDF, shuffle } from '../../../utils/bingo'

const HISTORY_KEY = 'bingo_history'

type Step = 'checking-auth' | 'loading' | 'pick-playlist' | 'config' | 'generating'

export default function NewGamePage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('checking-auth')
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
        // First check if authenticated
        const authRes = await fetch('/api/playlists')
        if (authRes.status === 401) {
          setStep('checking-auth')
          return
        }

        if (!authRes.ok) throw new Error()
        const { playlists } = await authRes.json()
        setPlaylists(playlists)
        setStep('pick-playlist')
      } catch {
        setError('No se pudo obtener tus playlists')
        setStep('pick-playlist')
      }
    }

    // Start by checking auth
    const checkAuth = async () => {
      await fetchPlaylists()
    }

    checkAuth()
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
      if (res.status === 401) { router.push('/login'); return }
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

  if (step === 'checking-auth') {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6">
        <div className="text-center max-w-md w-full">
          <div className="w-20 h-20 rounded-full bg-[#1DB954] flex items-center justify-center mx-auto mb-8">
            <svg viewBox="0 0 24 24" className="w-10 h-10 fill-black">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">Modo Offline</h1>
          <p className="text-[#a3a3a3] mb-8">Necesitas conectarte con Spotify para acceder a tus playlists</p>

          <button
            onClick={() => router.push('/login')}
            className="w-full bg-[#1DB954] hover:bg-[#1aa34a] text-black font-bold py-3 rounded-lg transition-all mb-4 flex items-center justify-center gap-3"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-black">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
            Conectar con Spotify
          </button>

          <button
            onClick={() => router.back()}
            className="w-full text-[#a3a3a3] hover:text-white py-2 transition"
          >
            ← Volver
          </button>
        </div>
      </main>
    )
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
            <ul className="space-y-2">
              {playlists.map(p => (
                <li key={p.id}>
                  <button
                    onClick={() => handleSelectPlaylist(p)}
                    className="w-full bg-[#141414] hover:bg-[#1e1e1e] border border-[#2a2a2a] hover:border-[#1DB954]/40 rounded-2xl p-4 text-left transition-all duration-150 group"
                  >
                    <p className="font-semibold text-white group-hover:text-[#1DB954] transition-colors">
                      {p.name}
                    </p>
                    <p className="text-sm text-[#a3a3a3] mt-0.5">
                      {p.tracks?.total ?? '?'} canciones · {p.owner?.display_name || 'Spotify'}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
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
