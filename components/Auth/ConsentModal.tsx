'use client';

import { useState } from 'react';
import Link from 'next/link';

interface ConsentModalProps {
  onConsent: (consent: ConsentData) => void;
  isLoading?: boolean;
}

export interface ConsentData {
  rgpdAgreed: boolean;
  privacyAgreed: boolean;
  termsAgreed: boolean;
  marketingOptIn: boolean;
}

/**
 * RGPD Consent Modal
 * Must be accepted before Spotify login
 * Complies with Spain RGPD requirements (LOPD-GDD, LSSI-CE)
 */
export default function ConsentModal({ onConsent, isLoading = false }: ConsentModalProps) {
  const [rgpdAgreed, setRgpdAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  const canProceed = rgpdAgreed && privacyAgreed && termsAgreed;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canProceed) return;

    onConsent({
      rgpdAgreed,
      privacyAgreed,
      termsAgreed,
      marketingOptIn,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center px-4 z-50">
      <div className="bg-[#1a1a1a] border border-[#404040] rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
        <div className="p-6 space-y-4">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">⚠️ Protección de Datos</h2>
            <p className="text-[#a3a3a3] text-sm">
              Antes de continuar, debes aceptar nuestra política de privacidad y términos (requerido por ley en
              España)
            </p>
          </div>

          {/* RGPD Consent */}
          <div className="space-y-3 border-t border-[#404040] pt-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="rgpd"
                checked={rgpdAgreed}
                onChange={(e) => setRgpdAgreed(e.target.checked)}
                disabled={isLoading}
                className="mt-1 w-5 h-5 accent-[#1DB954]"
              />
              <label htmlFor="rgpd" className="text-sm text-white">
                <span className="font-bold">✅ Acepto la Protección de Datos (RGPD)</span>
                <p className="text-[#a3a3a3] mt-1">
                  Entiendo que mis datos se procesan de forma segura según el Reglamento General de
                  Protección de Datos (RGPD UE 2016/679) y la Ley Orgánica de Protección de Datos española
                  (LOPD-GDD).
                </p>
                <ul className="text-[#606060] text-xs mt-2 space-y-1 ml-3">
                  <li>✓ Datos recopilados: email, nombre, ID Spotify (mínimo necesario)</li>
                  <li>✓ Seguridad: encriptación, auditoría, acceso restringido</li>
                  <li>✓ Derechos: acceso, rectificación, olvido, portabilidad</li>
                  <li>✓ Retención: mientras activa la cuenta + 30 días</li>
                </ul>
              </label>
            </div>

            {/* Privacy Agreement */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="privacy"
                checked={privacyAgreed}
                onChange={(e) => setPrivacyAgreed(e.target.checked)}
                disabled={isLoading}
                className="mt-1 w-5 h-5 accent-[#1DB954]"
              />
              <label htmlFor="privacy" className="text-sm text-white">
                <span className="font-bold">📋 Leo y Acepto la Política de Privacidad</span>
                <p className="text-[#a3a3a3] mt-1">
                  He leído y entiendo cómo se recopilan, usan y protegen mis datos personales.
                </p>
                <Link
                  href="/privacy"
                  target="_blank"
                  className="text-[#1DB954] hover:underline text-xs mt-2 block"
                >
                  Ver Política Completa →
                </Link>
              </label>
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                checked={termsAgreed}
                onChange={(e) => setTermsAgreed(e.target.checked)}
                disabled={isLoading}
                className="mt-1 w-5 h-5 accent-[#1DB954]"
              />
              <label htmlFor="terms" className="text-sm text-white">
                <span className="font-bold">⚖️ Leo y Acepto los Términos y Condiciones</span>
                <p className="text-[#a3a3a3] mt-1">
                  Entiendo y acepto los términos de uso, limitaciones de responsabilidad y política de
                  cancelación de cuenta.
                </p>
                <Link
                  href="/terms"
                  target="_blank"
                  className="text-[#1DB954] hover:underline text-xs mt-2 block"
                >
                  Ver Términos Completos →
                </Link>
              </label>
            </div>

            {/* Marketing Opt-in (optional) */}
            <div className="flex items-start gap-3 bg-[#0a0a0a] p-3 rounded-lg">
              <input
                type="checkbox"
                id="marketing"
                checked={marketingOptIn}
                onChange={(e) => setMarketingOptIn(e.target.checked)}
                disabled={isLoading}
                className="mt-1 w-5 h-5 accent-[#1DB954]"
              />
              <label htmlFor="marketing" className="text-sm text-white">
                <span className="font-bold">📧 Opcional: Recibir Novedades y Actualizaciones</span>
                <p className="text-[#a3a3a3] mt-1">
                  (Puedes cambiar esto después en configuración. Nunca compartiremos tu email con terceros)
                </p>
              </label>
            </div>
          </div>

          {/* Legal Notice */}
          <div className="bg-[#2a1a1a] border border-[#6b3030] rounded-lg p-3 text-xs text-[#ff9999]">
            <strong>⚠️ Aviso Legal:</strong> Debes aceptar los requisitos marcados (RGPD, Privacidad, Términos)
            para usar Bingo Musical. Esto es obligatorio por ley española.
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-[#404040]">
            <button
              onClick={handleSubmit}
              disabled={!canProceed || isLoading}
              className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                canProceed
                  ? 'bg-[#1DB954] hover:bg-[#1aa34a] text-black'
                  : 'bg-[#404040] text-[#a3a3a3] cursor-not-allowed'
              }`}
            >
              {isLoading ? 'Procesando...' : 'Aceptar y Continuar'}
            </button>
            <button
              onClick={() => window.history.back()}
              disabled={isLoading}
              className="flex-1 py-3 bg-[#282828] hover:bg-[#333333] text-white rounded-lg font-bold transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>

          {/* Compliance Footer */}
          <p className="text-xs text-[#606060] text-center border-t border-[#404040] pt-4">
            Esta aplicación cumple con RGPD, LOPD-GDD y LSSI-CE. Contacta privacy@bingomusical.es si tienes
            dudas.
          </p>
        </div>
      </div>
    </div>
  );
}
