'use client'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-400 to-green-600">
      <div className="flex flex-col items-center justify-center min-h-screen text-white">
        <h1 className="text-6xl font-bold mb-4">🎵 Bingo Musical</h1>
        <p className="text-2xl mb-8">Con Spotify</p>

        <a
          href="/api/auth/login"
          className="px-8 py-4 bg-black rounded-full text-white text-xl font-bold hover:bg-gray-800 transition"
        >
          Conectar con Spotify
        </a>
      </div>
    </main>
  )
}
