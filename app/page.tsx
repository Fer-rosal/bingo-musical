'use client'

import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-2xl w-full animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-[#1DB954] flex items-center justify-center mx-auto mb-8">
          <svg viewBox="0 0 24 24" className="w-10 h-10 fill-black">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
        </div>

        <h1 className="text-5xl font-bold text-white tracking-tight mb-3">
          Bingo Musical
        </h1>
        <p className="text-[#a3a3a3] text-lg mb-12">
          Crea cartones de bingo con tus playlists de Spotify
        </p>

        <div className="space-y-4">
          <div>
            <p className="text-[#a3a3a3] text-sm mb-3 uppercase tracking-wider">Jugar</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href="/api/auth/login"
                className="inline-flex items-center justify-center gap-3 bg-[#1DB954] hover:bg-[#1aa34a] text-black font-bold px-6 py-3 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-black">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
                Offline
              </a>
              <Link
                href="/join"
                className="inline-flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-black font-bold px-6 py-3 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-black">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
                </svg>
                Online
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
