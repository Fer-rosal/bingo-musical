'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { GameHistoryEntry } from '../../types/bingo'

const HISTORY_KEY = 'bingo_history'

export default function Dashboard() {
  const router = useRouter()
  const [history, setHistory] = useState<GameHistoryEntry[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (raw) setHistory(JSON.parse(raw))
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-400 to-green-600 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">🎵 Bingo Musical</h1>
        <p className="text-green-100 mb-8">Tu historial de partidas</p>

        <button
          onClick={() => router.push('/dashboard/new')}
          className="w-full py-4 bg-black text-white text-xl font-bold rounded-2xl hover:bg-gray-800 transition mb-8"
        >
          + Nueva Partida
        </button>

        {history.length === 0 ? (
          <p className="text-white text-center opacity-75">Aún no hay partidas guardadas.</p>
        ) : (
          <ul className="space-y-3">
            {[...history].reverse().map(entry => (
              <li key={entry.id} className="bg-white/20 rounded-xl p-4 text-white">
                <p className="font-bold text-lg">{entry.playlistName}</p>
                <p className="text-sm opacity-80">
                  {entry.playerCount} jugadores · Grilla {entry.gridSize}×{entry.gridSize} ·{' '}
                  {new Date(entry.date).toLocaleDateString('es')}
                </p>
                <span
                  className={`inline-block text-xs px-2 py-1 rounded-full mt-2 ${
                    entry.status === 'finished' ? 'bg-green-700' : 'bg-gray-600'
                  }`}
                >
                  {entry.status === 'finished' ? 'Finalizada' : 'Abandonada'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
