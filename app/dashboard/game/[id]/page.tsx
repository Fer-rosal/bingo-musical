'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import type { GameState, GameHistoryEntry } from '../../../../types/bingo'

const HISTORY_KEY = 'bingo_history'

export default function GamePage() {
  const router = useRouter()
  const params = useParams()
  const gameId = params.id as string

  const [game, setGame] = useState<GameState | null>(null)
  const [status, setStatus] = useState<'playing' | 'line-check' | 'bingo-check' | 'finished'>(
    'playing'
  )
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem(`game_${gameId}`)
    if (!raw) {
      router.push('/dashboard')
      return
    }

    const gameState: GameState = JSON.parse(raw)
    setGame(gameState)
    setStatus(gameState.status)
    setMounted(true)
  }, [gameId, router])

  const revealNext = () => {
    if (!game || status !== 'playing') return

    const nextId = game.shuffledQueue[game.drawnIds.length]
    if (!nextId) return

    const updated = { ...game, drawnIds: [...game.drawnIds, nextId] }
    setGame(updated)
    localStorage.setItem(`game_${gameId}`, JSON.stringify(updated))
  }

  const handleLine = () => {
    if (!game) return
    setStatus('line-check')
    const updated = { ...game, status: 'line-check' as const }
    setGame(updated)
    localStorage.setItem(`game_${gameId}`, JSON.stringify(updated))
  }

  const confirmLine = () => {
    if (!game) return
    setStatus('playing')
    const updated = { ...game, status: 'playing' as const }
    setGame(updated)
    localStorage.setItem(`game_${gameId}`, JSON.stringify(updated))
  }

  const handleBingo = () => {
    if (!game) return
    setStatus('bingo-check')
    const updated = { ...game, status: 'bingo-check' as const }
    setGame(updated)
    localStorage.setItem(`game_${gameId}`, JSON.stringify(updated))
  }

  const confirmBingo = () => {
    if (!game) return

    const raw = localStorage.getItem(HISTORY_KEY)
    const history: GameHistoryEntry[] = raw ? JSON.parse(raw) : []
    const idx = history.findIndex(h => h.id === gameId)
    if (idx !== -1) {
      history[idx].status = 'finished'
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
    }

    router.push('/dashboard')
  }

  if (!mounted || !game) {
    return null
  }

  const currentTrack = game.tracks.find(t => t.id === game.drawnIds.at(-1))
  const hasMoreSongs = game.drawnIds.length < game.shuffledQueue.length

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-400 to-green-600 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">🎵 Bingo Musical</h1>
          <p className="text-green-100">
            {game.config.playlistName} · {game.config.playerCount} jugadores
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 mb-8">
          <h2 className="text-sm font-bold text-gray-500 mb-4">CANCIÓN ACTUAL</h2>
          {currentTrack ? (
            <div>
              <p className="text-3xl font-bold text-black mb-2">{currentTrack.name}</p>
              <p className="text-lg text-gray-600">
                {currentTrack.artists.map(a => a.name).join(', ')}
              </p>
            </div>
          ) : (
            <p className="text-2xl text-gray-400">Haz clic para revelar la primera canción</p>
          )}
        </div>

        <button
          onClick={revealNext}
          disabled={!hasMoreSongs || status !== 'playing'}
          className="w-full py-4 bg-black text-white text-xl font-bold rounded-2xl hover:bg-gray-800 transition disabled:opacity-50 mb-6"
        >
          {hasMoreSongs ? 'REVELAR SIGUIENTE CANCIÓN' : 'NO HAY MÁS CANCIONES'}
        </button>

        <div className="flex gap-4 mb-8">
          {status === 'playing' && (
            <>
              <button
                onClick={handleLine}
                className="flex-1 py-3 bg-yellow-500 text-black text-lg font-bold rounded-xl hover:bg-yellow-600 transition"
              >
                LÍNEA
              </button>
              <button
                onClick={handleBingo}
                className="flex-1 py-3 bg-red-500 text-white text-lg font-bold rounded-xl hover:bg-red-600 transition"
              >
                BINGO
              </button>
            </>
          )}

          {status === 'line-check' && (
            <button
              onClick={confirmLine}
              className="w-full py-3 bg-green-500 text-white text-lg font-bold rounded-xl hover:bg-green-600 transition"
            >
              CONFIRMAR Y REANUDAR
            </button>
          )}

          {status === 'bingo-check' && (
            <button
              onClick={confirmBingo}
              className="w-full py-3 bg-green-700 text-white text-lg font-bold rounded-xl hover:bg-green-800 transition"
            >
              CONFIRMAR Y FINALIZAR PARTIDA
            </button>
          )}
        </div>

        <div className="bg-white/20 rounded-2xl p-6">
          <h3 className="text-white font-bold mb-4">
            Canciones jugadas ({game.drawnIds.length})
          </h3>
          <ul className="space-y-2 max-h-60 overflow-y-auto">
            {[...game.drawnIds].reverse().map((trackId, idx) => {
              const track = game.tracks.find(t => t.id === trackId)
              return (
                <li key={idx} className="text-white text-sm">
                  <span className="opacity-60">•</span> {track?.name}
                  {track?.artists.length ? (
                    <span className="opacity-60"> — {track.artists[0].name}</span>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </main>
  )
}
