'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ConsentModal, { ConsentData } from '@/components/Auth/ConsentModal';

/**
 * Login Page with RGPD Consent
 *
 * Flow:
 * 1. User sees consent modal (required)
 * 2. Accepts RGPD, Privacy, Terms
 * 3. Clicks Spotify login
 * 4. Consent stored in secure cookie
 * 5. Redirected to Spotify OAuth
 */
export default function LoginPage() {
  const router = useRouter();
  const [showConsent, setShowConsent] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConsent = async (consent: ConsentData) => {
    setIsLoading(true);
    setError('');

    try {
      // Send consent to backend and get Spotify auth URL
      const response = await fetch('/api/auth/spotify-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consent }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Error al iniciar sesión');
        setIsLoading(false);
        return;
      }

      const { authUrl } = await response.json();

      // Redirect to Spotify OAuth
      window.location.href = authUrl;
    } catch (err) {
      console.error('Login error:', err);
      setError('Error al procesar tu solicitud');
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6">
      {showConsent && <ConsentModal onConsent={handleConsent} isLoading={isLoading} />}

      {!showConsent && (
        <div className="text-center max-w-md w-full">
          <div className="w-20 h-20 rounded-full bg-[#1DB954] flex items-center justify-center mx-auto mb-8">
            <svg viewBox="0 0 24 24" className="w-10 h-10 fill-black">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
          </div>

          <h1 className="text-4xl font-bold text-white mb-3">Bingo Musical</h1>
          <p className="text-[#a3a3a3] mb-8">Juega bingo con la música que amas</p>

          {error && (
            <div className="bg-red-900 bg-opacity-30 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <button
            onClick={() => setShowConsent(true)}
            disabled={isLoading}
            className="w-full bg-[#1DB954] hover:bg-[#1aa34a] disabled:bg-[#404040] text-black font-bold py-3 rounded-lg transition-all mb-4 flex items-center justify-center gap-3"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-black">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
            {isLoading ? 'Conectando...' : 'Conectar con Spotify'}
          </button>

          <p className="text-[#a3a3a3] text-sm">
            No necesitas crear contraseña. Usamos tu cuenta de Spotify de forma segura.
          </p>

          <div className="mt-8 pt-8 border-t border-[#404040]">
            <p className="text-[#a3a3a3] text-xs mb-3">Información legal</p>
            <div className="flex gap-3 justify-center text-xs">
              <Link href="/privacy" className="text-[#1DB954] hover:underline">
                Privacidad
              </Link>
              <span className="text-[#404040]">•</span>
              <Link href="/terms" className="text-[#1DB954] hover:underline">
                Términos
              </Link>
              <span className="text-[#404040]">•</span>
              <a href="mailto:privacy@bingomusical.es" className="text-[#1DB954] hover:underline">
                Contacto
              </a>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
