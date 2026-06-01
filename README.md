# 🎵 Bingo Musical

Aplicación web para crear cartones de bingo musical usando tus playlists de Spotify.

## Características

- 🔐 Autenticación segura con Spotify OAuth
- 🎵 Obtén tus playlists de Spotify
- 📋 Genera cartones de bingo automáticos (5x5)
- 📥 Descarga cartones en PDF
- ▶️ Reproductor integrado de Spotify
- ✅ Marcado automático de canciones
- ⏸️ Control de reproducción (Pausar/Reanudar)
- ⚡ Construido con Next.js y npm

## Requisitos

- Node.js 18+
- npm 9+
- Cuenta Spotify Premium (para reproducción)
- Credenciales de Spotify Developer

## Setup

### 1. Clonar y instalar
```bash
git clone https://github.com/YOUR_USERNAME/bingo-musical.git
cd bingo-musical
npm install
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env.local
# Edita .env.local con tus credenciales de Spotify
```

### 3. Desarrollo
```bash
npm run dev
# Abre http://localhost:3000
```

### 4. Construcción
```bash
npm run build
npm start
```

## Testing

```bash
npm test                 # Run tests
npm test -- --watch     # Watch mode
npm test -- --coverage  # Coverage report
```

## Comandos disponibles

```bash
npm run dev              # Servidor de desarrollo
npm run build            # Build para producción
npm start                # Iniciar servidor producción
npm run lint             # ESLint
npm test                 # Jest tests
npm test -- --watch     # Jest watch mode
npm test -- --coverage  # Coverage report
```

## Deploy en Vercel

```bash
npm install -g vercel
vercel
```

## Agentes Especializados

Este proyecto utiliza 4 agentes especializados con Claude Code:

1. **Frontend Expert** - Componentes y UI
2. **Backend Expert** - API routes
3. **Test Expert** - Testing y QA
4. **Spotify Expert** - Integración Spotify

Ver `.agents/` para más detalles.

## Estructura
app/          - Next.js app directory
components/   - React components
utils/        - Funciones utilitarias
lib/          - Configuración y clientes
tests/        - Suite de tests
docs/         - Documentación
.agents/      - Especificaciones de agentes

## Documentación

- [Arquitectura](docs/ARCHITECTURE.md)
- [Agentes](docs/AGENTS.md)
- [npm Guide](docs/NPM.md)

## Stack Tecnológico

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Package Manager**: npm
- **Testing**: Jest, React Testing Library
- **API**: Spotify Web API
- **Deploy**: Vercel

## License

MIT
