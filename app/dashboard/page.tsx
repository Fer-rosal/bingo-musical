'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { GameHistoryEntry } from '../../types/bingo'

const HISTORY_KEY = 'bingo_history'

interface OnlineGameSummary {
  id: string
  gameCode: string
  playlistName: string
  playerCount: number
  gridSize: 4 | 5
  status: 'waiting' | 'playing' | 'finished'
  createdAt: number
}

type HistoryItem =
  | (GameHistoryEntry & { kind: 'offline' })
  | (OnlineGameSummary & { kind: 'online' })

export default function Dashboard() {
  const router = useRouter()
  const [items, setItems] = useState<HistoryItem[]>([])
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const raw = localStorage.getItem(HISTORY_KEY)
    const offline: HistoryItem[] = raw
      ? (JSON.parse(raw) as GameHistoryEntry[]).map(entry => ({ ...entry, kind: 'offline' as const }))
      : []
    setItems(offline)
    setMounted(true)

    fetch('/api/games/mine')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!data?.games) return
        const online: HistoryItem[] = (data.games as OnlineGameSummary[]).map(game => ({ ...game, kind: 'online' as const }))
        setItems(prev => [...prev.filter(i => i.kind !== 'online'), ...online])
      })
      .catch(() => {})
  }, [])

  const handleResumeGame = (item: HistoryItem) => {
    if (item.kind === 'online') {
      router.push(`/online/${item.id}/host`)
      return
    }
    const gameData = localStorage.getItem(`game_${item.id}`)
    if (!gameData) {
      setError('No se encontró la partida. Puede haber sido eliminada.')
      setTimeout(() => setError(''), 3000)
      return
    }
    router.push(`/dashboard/game/${item.id}`)
  }

  if (!mounted) return null

  const sorted = [...items].sort((a, b) => {
    const dateA = a.kind === 'offline' ? new Date(a.date).getTime() : a.createdAt
    const dateB = b.kind === 'offline' ? new Date(b.date).getTime() : b.createdAt
    return dateB - dateA
  })

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-6 py-10">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 rounded-full bg-[#1DB954] flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-black">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Bingo Musical</h1>
        </div>

        <button
          onClick={() => router.push('/dashboard/new')}
          className="w-full py-4 bg-[#1DB954] hover:bg-[#1aa34a] text-black font-bold text-base rounded-2xl transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] mb-10 flex items-center justify-center gap-2"
        >
          <span className="text-xl leading-none">+</span>
          Nueva Partida
        </button>

        <div>
          <h2 className="text-xs font-semibold text-[#a3a3a3] uppercase tracking-widest mb-4">
            Historial
          </h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 mb-4 text-sm">
              {error}
            </div>
          )}

          {sorted.length === 0 ? (
            <div className="text-center py-16 text-[#a3a3a3]">
              <p className="text-4xl mb-3">🎵</p>
              <p>Aún no hay partidas guardadas.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {sorted.map(item => {
                const date = item.kind === 'offline' ? item.date : new Date(item.createdAt).toISOString()
                const isFinished = item.status === 'finished'
                return (
                  <li key={`${item.kind}-${item.id}`}>
                    <button
                      onClick={() => handleResumeGame(item)}
                      className="group w-full bg-[#141414] hover:bg-[#1e1e1e] border border-[#2a2a2a] hover:border-[#1DB954]/40 rounded-2xl p-4 flex items-center justify-between transition-all duration-150 text-left"
                    >
                      <div>
                        <p className="font-semibold text-white group-hover:text-[#1DB954]">
                          {item.playlistName}
                          {item.kind === 'online' && <span className="ml-2 text-[10px] font-semibold text-[#1DB954]/80 align-middle">ONLINE</span>}
                        </p>
                        <p className="text-sm text-[#a3a3a3] mt-0.5">
                          {item.playerCount} jugadores · {item.gridSize}×{item.gridSize} ·{' '}
                          {new Date(date).toLocaleDateString('es')}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${
                          isFinished ? 'bg-[#1DB954]/15 text-[#1DB954]' : 'bg-white/5 text-[#a3a3a3]'
                        }`}
                      >
                        {isFinished ? 'Finalizada' : item.kind === 'online' ? 'En curso' : 'Abandonada'}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </main>
  )
}
