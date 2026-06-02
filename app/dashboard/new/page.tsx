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

  const calculateMinSongs = (grid: 4 | 5, preMarked: number) => {
    return grid * grid - preMarked
  }

  const minSongsRequired = calculateMinSongs(gridSize, preMarkedCount)

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const res = await fetch('/api/playlists')
        if (res.status === 401) {
          router.push('/api/auth/login')
          return
        }
        if (!res.ok) throw new Error('Error al obtener playlists')
        const { playlists } = await res.json()
        setPlaylists(playlists)
        setStep('pick-playlist')
      } catch (e) {
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
      if (res.status === 401) {
        router.push('/api/auth/login')
        return
      }
      if (!res.ok) throw new Error('Error al obtener canciones')

      const { tracks } = (await res.json()) as { tracks: SpotifyTrack[] }

      const minRequired = gridSize * gridSize - preMarkedCount
      if (tracks.length < minRequired) {
        setError(
          `Esta playlist no tiene suficientes canciones. Se necesitan al menos ${minRequired} canciones para una grilla ${gridSize}×${gridSize}. La playlist tiene ${tracks.length} canciones.`
        )
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
        id: gameId,
        config,
        tracks,
        shuffledQueue,
        drawnIds: [],
        status: 'playing',
        createdAt: new Date().toISOString(),
      }

      localStorage.setItem(`game_${gameId}`, JSON.stringify(gameState))

      const historyEntry: GameHistoryEntry = {
        id: gameId,
        playlistName: selectedPlaylist.name,
        playerCount,
        gridSize,
        date: new Date().toISOString(),
        status: 'abandoned',
      }

      const raw = localStorage.getItem(HISTORY_KEY)
      const history: GameHistoryEntry[] = raw ? JSON.parse(raw) : []
      history.push(historyEntry)
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history))

      await generatePDF(cards, config)
      router.push(`/dashboard/game/${gameId}`)
    } catch (e) {
      setError('Error al crear la partida')
      setStep('config')
    }
  }

  if (step === 'loading') {
    return (
      <main className="min-h-screen bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-4">Cargando playlists...</h1>
        </div>
      </main>
    )
  }

  if (step === 'pick-playlist') {
    return (
      <main className="min-h-screen bg-gradient-to-br from-green-400 to-green-600 p-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => router.back()}
            className="text-white mb-6 hover:underline"
          >
            ← Volver
          </button>
          <h1 className="text-4xl font-bold text-white mb-8">Elige una playlist</h1>

          {error && <p className="text-red-200 mb-4">{error}</p>}

          {playlists.length === 0 ? (
            <p className="text-white text-center">No hay playlists disponibles</p>
          ) : (
            <ul className="space-y-3">
              {playlists.map(p => (
                <li key={p.id}>
                  <button
                    onClick={() => handleSelectPlaylist(p)}
                    className="w-full bg-white/20 rounded-xl p-4 text-left text-white hover:bg-white/30 transition"
                  >
                    <p className="font-bold text-lg">{p.name}</p>
                    <p className="text-sm opacity-80">
                      {p.tracks?.total ?? '?'} canciones
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

  if (step === 'generating') {
    return (
      <main className="min-h-screen bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-4">Generando cartones...</h1>
          <p className="text-lg opacity-75">Esto puede tomar un momento...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-400 to-green-600 p-6">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => {
            setStep('pick-playlist')
            setSelectedPlaylist(null)
          }}
          className="text-white mb-6 hover:underline"
        >
          ← Cambiar playlist
        </button>

        <h1 className="text-3xl font-bold text-white mb-2">Configurar partida</h1>
        <p className="text-green-100 mb-8">{selectedPlaylist?.name}</p>

        {error && <p className="text-red-200 mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-white font-bold mb-2">Número de jugadores</label>
            <input
              type="number"
              min="1"
              max="500"
              value={playerCount}
              onChange={e => setPlayerCount(parseInt(e.target.value))}
              className="w-full px-4 py-2 rounded-lg"
            />
            <p className="text-green-100 text-sm mt-1">
              Mínimo {minSongsRequired} canciones (más canciones = más variedad)
            </p>
          </div>

          <div>
            <label className="block text-white font-bold mb-2">Tamaño de grilla</label>
            <select
              value={gridSize}
              onChange={e => setGridSize(parseInt(e.target.value) as 4 | 5)}
              className="w-full px-4 py-2 rounded-lg"
            >
              <option value="4">4×4 (16 casillas)</option>
              <option value="5">5×5 (25 casillas)</option>
            </select>
          </div>

          <div>
            <label className="block text-white font-bold mb-2">
              Casillas pre-marcadas: {preMarkedCount}
            </label>
            <p className="text-green-100 text-sm mb-2">1 = solo el centro</p>
            <input
              type="range"
              min="1"
              max="5"
              value={preMarkedCount}
              onChange={e => setPreMarkedCount(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <button
            type="submit"
            disabled={step !== 'config'}
            className="w-full py-4 bg-black text-white text-xl font-bold rounded-2xl hover:bg-gray-800 transition disabled:opacity-50"
          >
            Generar Cartones
          </button>
        </form>
      </div>
    </main>
  )
}
