'use client'

import Link from 'next/link';

export default function OnlineGameOptionsPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-2xl w-full animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-[#1DB954] flex items-center justify-center mx-auto mb-8">
          <svg viewBox="0 0 24 24" className="w-10 h-10 fill-black">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
          </svg>
        </div>

        <h1 className="text-5xl font-bold text-white tracking-tight mb-3">
          Juego Online
        </h1>
        <p className="text-[#a3a3a3] text-lg mb-12">
          Elige si deseas crear o unirte a un juego
        </p>

        <div className="space-y-4">
          <Link
            href="/online/create"
            className="block bg-[#1DB954] hover:bg-[#1aa34a] text-black font-bold px-6 py-4 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <div className="text-xl mb-2">🎵 Crear Juego</div>
            <div className="text-sm opacity-90">Sé el anfitrión y crea un nuevo juego con tu playlist</div>
          </Link>

          <Link
            href="/join"
            className="block bg-white hover:bg-gray-100 text-black font-bold px-6 py-4 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <div className="text-xl mb-2">👥 Unirme a Juego</div>
            <div className="text-sm opacity-90">Únete a un juego existente con código o QR</div>
          </Link>
        </div>

        <Link
          href="/"
          className="text-[#a3a3a3] hover:text-white mt-12 inline-block text-sm"
        >
          ← Volver al inicio
        </Link>
      </div>
    </main>
  );
}
