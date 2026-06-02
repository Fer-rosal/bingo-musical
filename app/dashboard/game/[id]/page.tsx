'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import type { GameState, GameHistoryEntry } from '../../../../types/bingo'

const HISTORY_KEY = 'bingo_history'

declare global {
  interface Window {
    Spotify: any
    onSpotifyWebPlaybackSDKReady: () => void
  }
}

export default function GamePage() {
  const router = useRouter()
  const params = useParams()
  const gameId = params.id as string

  const [game, setGame] = useState<GameState | null>(null)
  const [status, setStatus] = useState<'playing' | 'line-check' | 'bingo-check' | 'finished'>('playing')
  const [mounted, setMounted] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [player, setPlayer] = useState<any>(null)
  const [playerReady, setPlayerReady] = useState(false)
  const [deviceError, setDeviceError] = useState('')
  const deviceIdRef = useRef<string | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem(`game_${gameId}`)
    if (!raw) { router.push('/dashboard'); return }
    const gameState: GameState = JSON.parse(raw)
    setGame(gameState)
    setStatus(gameState.status)
    setMounted(true)
  }, [gameId, router])

  useEffect(() => {
    let isMounted = true

    const initPlayer = async () => {
      try {
        const res = await fetch('/api/auth/token')
        if (!res.ok) return
        const { token } = await res.json()

        window.onSpotifyWebPlaybackSDKReady = () => {
          if (!isMounted) return

          const spotifyPlayer = new window.Spotify.Player({
            name: 'Bingo Musical',
            getOAuthToken: (callback: (token: string) => void) => callback(token),
            volume: 0.5,
          })

          spotifyPlayer.addListener('player_state_changed', (state: any) => {
            if (state) setIsPlaying(!state.paused)
          })

          spotifyPlayer.addListener('ready', ({ device_id }: { device_id: string }) => {
            deviceIdRef.current = device_id
            if (isMounted) { setPlayer(spotifyPlayer); setPlayerReady(true) }
          })

          spotifyPlayer.addListener('not_ready', () => {
            deviceIdRef.current = null
            if (isMounted) setPlayerReady(false)
          })

          spotifyPlayer.addListener('initialization_error', ({ message }: any) => {
            if (isMounted) setDeviceError('Error inicializando: ' + message)
          })

          spotifyPlayer.addListener('authentication_error', ({ message }: any) => {
            if (isMounted) setDeviceError('Error de autenticación: ' + message)
          })

          spotifyPlayer.connect()
        }

        const script = document.createElement('script')
        script.src = 'https://sdk.scdn.co/spotify-player.js'
        script.async = true
        document.body.appendChild(script)
      } catch (e) {
        console.error('Failed to init Spotify player:', e)
      }
    }

    initPlayer()
    return () => {
      isMounted = false
      if (player) player.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!game || !playerReady || !deviceIdRef.current) return

    const playTrack = async () => {
      const currentTrack = game.tracks.find(t => t.id === game.drawnIds.at(-1))
      if (!currentTrack) return

      try {
        const tokenRes = await fetch('/api/auth/token')
        if (!tokenRes.ok) return
        const { token } = await tokenRes.json()

        const res = await fetch(
          `https://api.spotify.com/v1/me/player/play?device_id=${deviceIdRef.current}`,
          {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ uris: [`spotify:track:${currentTrack.id}`] }),
          }
        )

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          console.error('Play failed:', res.status, body)
        }
      } catch (e) {
        console.error('Failed to play track:', e)
      }
    }

    playTrack()
  }, [game?.drawnIds, playerReady])

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

  const togglePlayPause = () => {
    if (!player) return
    player.togglePlay()
  }

  if (!mounted || !game) return null

  const currentTrack = game.tracks.find(t => t.id === game.drawnIds.at(-1))
  const hasMoreSongs = game.drawnIds.length < game.shuffledQueue.length
  const progress = game.drawnIds.length / game.shuffledQueue.length

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-6">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#1DB954] flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-black">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
            </div>
            <span className="font-semibold text-white text-sm">{game.config.playlistName}</span>
          </div>
          <span className="text-[#a3a3a3] text-sm">{game.config.playerCount} jugadores</span>
        </div>

        {/* Current track card */}
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-3xl p-6 mb-4">
          <p className="text-xs font-semibold text-[#a3a3a3] uppercase tracking-widest mb-4">
            Canción actual
          </p>

          {currentTrack ? (
            <div className="animate-fade-in">
              <p className="text-2xl font-bold text-white leading-tight mb-1">
                {currentTrack.name}
              </p>
              <p className="text-[#a3a3a3] mb-6">
                {currentTrack.artists.map(a => a.name).join(', ')}
              </p>

              {deviceError && (
                <p className="text-xs text-red-400 mb-3">{deviceError}</p>
              )}

              {playerReady ? (
                <button
                  onClick={togglePlayPause}
                  className="flex items-center gap-2 bg-[#1DB954] hover:bg-[#1aa34a] text-black font-bold text-sm px-5 py-2.5 rounded-full transition-all duration-150 hover:scale-105 active:scale-95 pulse-green"
                >
                  {isPlaying ? (
                    <>
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-black">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                      </svg>
                      Pausar
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-black">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                      Reproducir
                    </>
                  )}
                </button>
              ) : (
                <div className="flex items-center gap-2 text-[#a3a3a3] text-sm">
                  <div className="w-3 h-3 border border-[#a3a3a3] border-t-transparent rounded-full animate-spin" />
                  Cargando reproductor...
                </div>
              )}
            </div>
          ) : (
            <p className="text-[#a3a3a3]">Pulsa el botón para revelar la primera canción</p>
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1DB954] rounded-full transition-all duration-500"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <p className="text-xs text-[#a3a3a3] mt-1 text-right">
            {game.drawnIds.length} / {game.shuffledQueue.length}
          </p>
        </div>

        {/* Reveal button */}
        <button
          onClick={revealNext}
          disabled={!hasMoreSongs || status !== 'playing'}
          className="w-full py-4 bg-white hover:bg-[#f0f0f0] disabled:bg-[#1e1e1e] disabled:text-[#a3a3a3] text-black font-bold text-base rounded-2xl transition-all duration-150 hover:scale-[1.01] active:scale-[0.99] disabled:scale-100 disabled:cursor-not-allowed mb-3"
        >
          {hasMoreSongs ? '⏭ Siguiente canción' : 'No hay más canciones'}
        </button>

        {/* Line / Bingo buttons */}
        <div className="flex gap-2 mb-6">
          {status === 'playing' && (
            <>
              <button
                onClick={handleLine}
                className="flex-1 py-3 bg-[#141414] hover:bg-[#1e1e1e] border border-[#2a2a2a] hover:border-yellow-500/50 text-yellow-400 font-bold text-sm rounded-2xl transition-all duration-150"
              >
                LÍNEA
              </button>
              <button
                onClick={handleBingo}
                className="flex-1 py-3 bg-[#141414] hover:bg-[#1e1e1e] border border-[#2a2a2a] hover:border-red-500/50 text-red-400 font-bold text-sm rounded-2xl transition-all duration-150"
              >
                BINGO
              </button>
            </>
          )}
          {status === 'line-check' && (
            <button
              onClick={confirmLine}
              className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-sm rounded-2xl transition-all"
            >
              ✓ Confirmar línea y reanudar
            </button>
          )}
          {status === 'bingo-check' && (
            <button
              onClick={confirmBingo}
              className="w-full py-3 bg-[#1DB954] hover:bg-[#1aa34a] text-black font-bold text-sm rounded-2xl transition-all"
            >
              🎉 Confirmar BINGO y finalizar
            </button>
          )}
        </div>

        {/* Played songs */}
        {game.drawnIds.length > 0 && (
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-4">
            <p className="text-xs font-semibold text-[#a3a3a3] uppercase tracking-widest mb-3">
              Canciones jugadas ({game.drawnIds.length})
            </p>
            <ul className="space-y-2 max-h-52 overflow-y-auto">
              {[...game.drawnIds].reverse().map((trackId, idx) => {
                const track = game.tracks.find(t => t.id === trackId)
                const isCurrent = idx === 0
                return (
                  <li key={idx} className={`text-sm flex items-baseline gap-2 ${isCurrent ? 'text-white' : 'text-[#a3a3a3]'}`}>
                    {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-[#1DB954] shrink-0 mt-1.5" />}
                    {!isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-[#2a2a2a] shrink-0 mt-1.5" />}
                    <span className={isCurrent ? 'font-semibold' : ''}>
                      {track?.name}
                      {track?.artists.length ? (
                        <span className="font-normal text-[#a3a3a3]"> — {track.artists[0].name}</span>
                      ) : null}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </main>
  )
}
