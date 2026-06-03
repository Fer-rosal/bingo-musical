'use client'

import { useRouter } from 'next/navigation'

interface ReconnectModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ReconnectModal({ isOpen, onClose }: ReconnectModalProps) {
  const router = useRouter()

  if (!isOpen) return null

  const handleReconnect = () => {
    router.push('/api/auth/login')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-3xl p-8 max-w-sm mx-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 mb-4">
            <svg className="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-white mb-2">Sesión expirada</h2>
          <p className="text-[#a3a3a3] mb-6 text-sm">
            Tu conexión con Spotify ha expirado. Por favor, reconéctate para continuar jugando.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-[#1e1e1e] hover:bg-[#2a2a2a] border border-[#2a2a2a] text-[#a3a3a3] font-semibold rounded-xl transition-all"
            >
              Cerrar
            </button>
            <button
              onClick={handleReconnect}
              className="flex-1 py-3 bg-[#1DB954] hover:bg-[#1aa34a] text-black font-bold rounded-xl transition-all"
            >
              Reconectar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
