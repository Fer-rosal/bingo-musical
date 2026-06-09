'use client';

import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] px-6 py-12">
      <div className="max-w-3xl mx-auto text-white">
        <Link href="/" className="text-[#1DB954] hover:underline mb-8 inline-block">
          ← Volver
        </Link>

        <h1 className="text-4xl font-bold mb-8">Política de Privacidad</h1>
        <p className="text-[#a3a3a3] mb-4">Última actualización: 2026-06-05</p>

        <div className="prose prose-invert max-w-none space-y-6 text-[#c0c0c0]">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-3">1. Introducción</h2>
            <p>
              Bingo Musical ("nosotros" o "la aplicación") respeta tu privacidad y se compromete a cumplir con:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>
                <strong>Reglamento General de Protección de Datos (RGPD)</strong> - UE 2016/679
              </li>
              <li>
                <strong>Ley Orgánica de Protección de Datos (LOPD-GDD)</strong> - España, Ley 3/2018
              </li>
              <li>
                <strong>Ley de Servicios de la Sociedad de la Información (LSSI-CE)</strong> - España, Ley
                34/1988
              </li>
            </ul>
          </section>

          {/* Data Collection */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-3">2. Datos que Recopilamos</h2>
            <p>
              <strong>Principio de Minimización de Datos:</strong> Solo recopilamos información necesaria para
              proporcionar nuestros servicios.
            </p>

            <div className="bg-[#1a1a1a] border border-[#404040] rounded-lg p-4 mt-4">
              <h3 className="font-bold text-white mb-3">Datos Recopilados:</h3>
              <ul className="space-y-2">
                <li>
                  📧 <strong>Correo electrónico</strong> - Para autenticación y comunicaciones sobre tu cuenta
                </li>
                <li>
                  👤 <strong>Nombre (opcional)</strong> - Para personalizar la experiencia
                </li>
                <li>
                  🎵 <strong>ID de Spotify</strong> - Para acceder a tus playlists (con tu consentimiento)
                </li>
                <li>
                  📋 <strong>Registros de consentimiento</strong> - Para cumplir con requisitos legales
                </li>
                <li>
                  ⏰ <strong>Fechas de creación/actualización</strong> - Para auditoría y seguridad
                </li>
              </ul>
            </div>

            <div className="bg-[#2a1a1a] border border-[#6b3030] rounded-lg p-4 mt-4">
              <h3 className="font-bold text-[#ff6b6b] mb-3">❌ NUNCA Recopilamos:</h3>
              <ul className="space-y-2 text-sm">
                <li>🔐 Contraseñas (Firebase las gestiona de forma segura)</li>
                <li>💳 Información de pago (usamos procesadores terceros)</li>
                <li>📱 Número de teléfono</li>
                <li>🏠 Dirección domiciliaria</li>
                <li>📍 Localización GPS</li>
                <li>🔍 Registros detallados de actividad</li>
              </ul>
            </div>
          </section>

          {/* Legal Basis */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-3">3. Base Legal para el Tratamiento</h2>
            <p>Procesamos tus datos en base a:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>
                <strong>Consentimiento explícito (RGPD Art. 6.1.a)</strong> - Debes aceptar esta política y
                nuestros términos antes de crear una cuenta
              </li>
              <li>
                <strong>Ejecución del contrato (RGPD Art. 6.1.b)</strong> - Necesario para proporcionar
                nuestros servicios
              </li>
              <li>
                <strong>Obligación legal (RGPD Art. 6.1.c)</strong> - Cuando la ley lo requiere
              </li>
            </ul>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-3">4. Seguridad de Datos</h2>
            <div className="bg-[#1a2a1a] border border-[#2a5a2a] rounded-lg p-4">
              <h3 className="font-bold text-[#4ade80] mb-3">✅ Medidas de Seguridad:</h3>
              <ul className="space-y-2 text-sm">
                <li>🔐 Encriptación de datos en tránsito (HTTPS TLS 1.2+)</li>
                <li>🔒 Base de datos segura con Firebase (encriptada en reposo)</li>
                <li>🛡️ Autenticación segura vía OAuth (no almacenamos contraseñas)</li>
                <li>📋 Auditoría de acceso a datos sensibles</li>
                <li>🚨 Monitoreo de seguridad 24/7</li>
                <li>🔄 Backup automático y recuperación de desastres</li>
              </ul>
            </div>
          </section>

          {/* User Rights */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-3">5. Tus Derechos (RGPD)</h2>
            <p>Tienes derecho a:</p>
            <ul className="space-y-3 mt-3">
              <li>
                <strong>📖 Derecho de Acceso:</strong> Solicitar copia de todos tus datos personales
              </li>
              <li>
                <strong>✏️ Derecho de Rectificación:</strong> Corregir datos inexactos o incompletos
              </li>
              <li>
                <strong>🗑️ Derecho al Olvido:</strong> Solicitar la eliminación de tus datos (con
                excepciones legales)
              </li>
              <li>
                <strong>⛔ Derecho a Limitar el Tratamiento:</strong> Restringir cómo usamos tus datos
              </li>
              <li>
                <strong>🔄 Derecho a la Portabilidad:</strong> Obtener tus datos en formato estructurado
              </li>
              <li>
                <strong>🚫 Derecho a Oponerle:</strong> Oponerse al procesamiento de datos
              </li>
            </ul>

            <p className="mt-4 text-sm">
              Para ejercer estos derechos, contacta: <strong>privacy@bingomusical.es</strong>
            </p>
          </section>

          {/* Cookies & Tracking */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-3">6. Cookies y Tecnologías de Seguimiento</h2>
            <p>
              <strong>Política de Cookies:</strong> Solo utilizamos cookies esenciales para autenticación y
              seguridad.
            </p>
            <div className="bg-[#1a1a1a] border border-[#404040] rounded-lg p-4 mt-4">
              <p className="text-sm">
                ✅ Cookies técnicas (sesión, CSRF) - Esenciales, sin consentimiento previo
                <br />
                ❌ Cookies de analítica - No usamos Google Analytics ni similares
                <br />
                ❌ Cookies de publicidad - No rastreamos ni vendemos datos
              </p>
            </div>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-3">7. Retención de Datos</h2>
            <ul className="space-y-2">
              <li>
                <strong>Datos de cuenta:</strong> Mientras mantengas tu cuenta activa + 30 días después de
                eliminación
              </li>
              <li>
                <strong>Registros de consentimiento:</strong> 3 años (requisito legal)
              </li>
              <li>
                <strong>Registros de seguridad:</strong> 90 días para auditoría
              </li>
              <li>
                <strong>Datos de juegos:</strong> Mientras el juego esté activo, después se anonomizan
              </li>
            </ul>
          </section>

          {/* Third Parties */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-3">8. Compartición de Datos</h2>
            <p>
              Solo compartimos datos cuando es necesario para proporcionar nuestros servicios:
            </p>
            <ul className="space-y-2 mt-3">
              <li>
                <strong>Spotify:</strong> ID de usuario y permisos de playlist (con tu consentimiento)
              </li>
              <li>
                <strong>Firebase:</strong> Almacenamiento seguro con Google (suscriptor de procesamiento de
                datos)
              </li>
              <li>
                <strong>Proveedores de correo:</strong> Solo para enviar confirmaciones (sin historial
                completo)
              </li>
            </ul>
            <p className="text-sm mt-3">
              🚫 NUNCA vendemos tus datos a terceros publicitarios
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-3">9. Contacto - Responsable de Protección de Datos</h2>
            <div className="bg-[#1a1a1a] border border-[#404040] rounded-lg p-4">
              <p className="font-bold">Delegado de Protección de Datos (DPD):</p>
              <p>Email: privacy@bingomusical.es</p>
              <p>Dirección: España (contacto vía email preferido)</p>
              <p className="text-sm mt-3 text-[#a3a3a3]">
                Responderemos a solicitudes de derechos dentro de 30 días hábiles (requisito RGPD)
              </p>
            </div>
          </section>

          {/* Changes */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-3">10. Cambios a Esta Política</h2>
            <p>
              Si realizamos cambios materiales, te notificaremos por email y solicitaremos nuevo consentimiento
              si es necesario.
            </p>
          </section>

          {/* Legal Note */}
          <section className="border-t border-[#404040] pt-6 mt-8">
            <p className="text-sm text-[#606060]">
              Esta Política de Privacidad cumple con la legislación de protección de datos de la Unión Europea
              y España. Para reclamaciones sobre nuestras prácticas, puedes contactar con la Autoridad de
              Protección de Datos española (AEPD): www.aepd.es
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
