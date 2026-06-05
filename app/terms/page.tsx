'use client';

import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] px-6 py-12">
      <div className="max-w-3xl mx-auto text-white">
        <Link href="/" className="text-[#1DB954] hover:underline mb-8 inline-block">
          ← Volver
        </Link>

        <h1 className="text-4xl font-bold mb-8">Términos y Condiciones</h1>
        <p className="text-[#a3a3a3] mb-4">Última actualización: 2026-06-05</p>

        <div className="prose prose-invert max-w-none space-y-6 text-[#c0c0c0]">
          {/* Intro */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-3">1. Aceptación de Términos</h2>
            <p>
              Al acceder y usar Bingo Musical, aceptas estar legalmente vinculado por estos términos. Si no
              aceptas, <strong>no uses la aplicación</strong>.
            </p>
          </section>

          {/* Service Description */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-3">2. Descripción del Servicio</h2>
            <p>Bingo Musical es una aplicación web para crear y jugar bingo musical usando playlists de Spotify.</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>
                <strong>Versión Offline:</strong> Cartones generados localmente, sin datos en servidor
              </li>
              <li>
                <strong>Versión Online:</strong> Juegos multijugador con sincronización en tiempo real vía Firebase
              </li>
            </ul>
          </section>

          {/* User Responsibilities */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-3">3. Responsabilidades del Usuario</h2>
            <p>Al usar Bingo Musical, aceptas:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>✅ Proporcionar información precisa y verdadera en tu cuenta</li>
              <li>✅ Mantener la confidencialidad de tus credenciales de autenticación</li>
              <li>✅ Usar la aplicación solo con fines legales y autorizados</li>
              <li>✅ No intentar acceso no autorizado o daño a sistemas</li>
              <li>✅ Respetar los derechos de otros usuarios</li>
              <li>✅ Cumplir con leyes aplicables (incluyendo derechos de autor de Spotify)</li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-3">4. Propiedad Intelectual</h2>
            <div className="space-y-3">
              <div>
                <strong className="text-[#1DB954]">🎵 Contenido de Spotify:</strong>
                <p className="text-sm mt-1">
                  Las canciones, artistas y playlists provienen de Spotify. Respetamos todos los derechos de
                  autor de Spotify y artistas. El uso está limitado por los términos de Spotify.
                </p>
              </div>
              <div>
                <strong className="text-[#1DB954]">⚙️ Código de Bingo Musical:</strong>
                <p className="text-sm mt-1">
                  El código fuente está disponible bajo licencia abierta. Puedes usar, modificar y distribuir
                  según los términos de la licencia específica.
                </p>
              </div>
              <div>
                <strong className="text-[#1DB954]">🎨 Marca:</strong>
                <p className="text-sm mt-1">
                  "Bingo Musical" es marca de la aplicación. No puedes usar nuestro nombre, logo o marca sin
                  permiso.
                </p>
              </div>
            </div>
          </section>

          {/* Acceptable Use Policy */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-3">5. Política de Uso Aceptable</h2>
            <p>
              <strong>Está prohibido:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Acceso no autorizado, intentos de "hacking" o bypass de seguridad</li>
              <li>Spam, acoso, abuso o contenido ofensivo hacia otros usuarios</li>
              <li>Scraping de datos, bots automáticos o uso de herramientas no autorizadas</li>
              <li>Intentos de deshabilitar, sobrecargar o interferir con el servicio (DoS)</li>
              <li>Distribución de malware, virus o código malicioso</li>
              <li>Violación de derechos de propiedad intelectual de terceros</li>
              <li>Uso para actividades ilegales o fraudulentas</li>
            </ul>
            <p className="mt-3 text-[#ff6b6b]">
              <strong>⚠️ Consecuencia:</strong> Violaciones pueden resultar en suspensión inmediata de cuenta y
              reporte a autoridades si es necesario.
            </p>
          </section>

          {/* Data & Privacy */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-3">6. Datos y Privacidad</h2>
            <p>
              Lee nuestra <Link href="/privacy" className="text-[#1DB954] hover:underline">
                Política de Privacidad
              </Link>{' '}
              completa. Puntos clave:
            </p>
            <ul className="space-y-2 mt-3">
              <li>✅ Tus datos están protegidos según RGPD y leyes españolas</li>
              <li>✅ Nunca almacenamos contraseñas (Firebase lo hace de forma segura)</li>
              <li>✅ Puedes solicitar acceso, corrección o eliminación de tus datos (Derecho al Olvido)</li>
              <li>✅ Tu consentimiento explícito es requerido para procesar datos personales</li>
            </ul>
          </section>

          {/* Spotify Integration */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-3">7. Integración con Spotify</h2>
            <p>
              Bingo Musical se integra con Spotify para acceder a tus playlists. Aceptas:
            </p>
            <ul className="space-y-2 mt-3">
              <li>
                📖 Lees y aceptas los <strong>Términos de Spotify</strong> (https://www.spotify.com/es/legal/)
              </li>
              <li>
                🎵 Solo usamos Spotify para generar cartones de bingo, NO para otros propósitos
              </li>
              <li>
                🔐 Tu token de Spotify no se almacena permanentemente, solo en sesión (máx 1 hora)
              </li>
              <li>
                🚫 No compartimos tu información de Spotify con terceros
              </li>
              <li>
                ⚠️ Eres responsable de tu cuenta de Spotify; nosotros no modificamos playlists
              </li>
            </ul>
          </section>

          {/* Disclaimers */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-3">8. Exención de Responsabilidad</h2>
            <div className="bg-[#2a1a1a] border border-[#6b3030] rounded-lg p-4">
              <p className="font-bold text-[#ff9999] mb-3">RENUNCIA DE GARANTÍAS</p>
              <p className="text-sm space-y-2">
                Bingo Musical se proporciona "TAL COMO ESTÁ" sin garantías de ningún tipo:
              </p>
              <ul className="text-sm space-y-2 mt-3">
                <li>• Disponibilidad ininterrumpida del servicio</li>
                <li>• Precisión de resultados o datos</li>
                <li>• Compatibilidad con todas las playlists de Spotify</li>
                <li>• Recuperación de datos perdidos o corruptos</li>
                <li>• Seguridad contra hackers (aunque implementamos medidas razonables)</li>
              </ul>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-3">9. Limitación de Responsabilidad</h2>
            <p>
              <strong>EN NINGÚN CASO</strong> somos responsables por daños indirectos, incidentales, especiales
              o consecuentes (incluyendo pérdida de datos, ingresos o negocios) derivados del uso o
              imposibilidad de usar Bingo Musical.
            </p>
            <p className="text-sm mt-3 text-[#a3a3a3]">
              (Esto está sujeto a los límites permitidos por la ley española - no renunciamos a responsabilidad
              por daños derivados de negligencia grave)
            </p>
          </section>

          {/* Service Changes */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-3">10. Cambios en el Servicio</h2>
            <p>
              Nos reservamos el derecho a:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Modificar características y funcionalidad de Bingo Musical</li>
              <li>Suspender o descontinuar el servicio con 30 días de aviso</li>
              <li>Actualizar estos términos (notificación vía email para cambios materiales)</li>
              <li>Cambiar planes de precios (con 30 días de aviso)</li>
            </ul>
          </section>

          {/* Suspension */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-3">11. Suspensión de Cuenta</h2>
            <p>
              Podemos suspender tu cuenta si:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Violas estos términos o nuestra Política de Uso Aceptable</li>
              <li>Intentas acceso no autorizado o daño a sistemas</li>
              <li>Realizas actividades ilegales o fraudulentas</li>
              <li>Incumples los términos de Spotify</li>
            </ul>
            <p className="mt-3">
              <strong>Antes de suspensión permanente:</strong> Te notificaremos y daremos oportunidad de ser
              escuchado (excepto en casos de seguridad grave).
            </p>
          </section>

          {/* Dispute Resolution */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-3">12. Resolución de Disputas</h2>
            <p>
              Cualquier disputa se regirá por las leyes de <strong>España</strong> y será resuelta por los
              <strong> tribunales competentes de España</strong>.
            </p>
            <p className="mt-3 text-sm">
              (Si eres consumidor, también puedes usar mecanismos alternativos como arbitraje de consumo)
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-3">13. Contacto y Preguntas</h2>
            <div className="bg-[#1a1a1a] border border-[#404040] rounded-lg p-4">
              <p>¿Preguntas sobre estos términos?</p>
              <p className="mt-2">
                Email: <strong>legal@bingomusical.es</strong>
              </p>
              <p className="text-sm mt-3 text-[#a3a3a3]">
                Responderemos dentro de 5 días hábiles
              </p>
            </div>
          </section>

          {/* Legal Compliance */}
          <section className="border-t border-[#404040] pt-6 mt-8">
            <p className="text-sm text-[#606060]">
              Estos términos cumplen con LSSI-CE (Ley de Servicios de la Sociedad de la Información - España)
              y la legislación general de protección de datos de la UE (RGPD).
            </p>
            <p className="text-sm mt-3 text-[#606060]">
              Última actualización: 5 de junio de 2026
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
