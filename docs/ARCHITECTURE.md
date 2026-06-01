# Arquitectura - Bingo Musical

## Overview
Aplicación Next.js con autenticación OAuth de Spotify, generación de cartones de bingo PDF, y reproductor con seguimiento en tiempo real.

## Stack
- Frontend: Next.js 14, React 18, TypeScript, Tailwind CSS
- Backend: Next.js API Routes
- APIs Externas: Spotify Web API
- Package Manager: npm
- Testing: Jest, React Testing Library
- Deploy: Vercel

## Flujo de la aplicación

### 1. Autenticación
Usuario → Login → OAuth Spotify → Token almacenado → Dashboard

### 2. Selección de Playlist
Dashboard → Obtener playlists usuario → Seleccionar → Cargar tracks

### 3. Configuración del Bingo
Seleccionar # de cartones → Generar cartones → Descargar PDF

### 4. Reproducción
Iniciar música → Marcar canciones → Pausar/Reanudar → Terminar

## Carpeta Structure
app/                    # Next.js app directory
├── api/                # API routes
│   └── auth/          # OAuth endpoints
├── dashboard/          # Páginas autenticadas
│   └── bingo/         # Reproductor
└── page.tsx           # Home page
components/            # React components
├── bingo/             # Cartones y reproductor
├── auth/              # Auth components
└── common/            # Componentes comunes
utils/                 # Funciones utilitarias
├── spotify/           # Spotify helpers
└── bingo/             # Lógica de cartones
lib/                   # Librerías y configuración
├── spotify.ts         # Spotify client
tests/                 # Tests
├── unit/              # Unit tests
└── integration/       # Integration tests

## Key Features
- [ ] OAuth con Spotify
- [ ] Obtener playlists del usuario
- [ ] Generación de cartones (variable)
- [ ] Exportar a PDF
- [ ] Reproductor Spotify integrado
- [ ] Marcado automático de tracks
- [ ] Pausar/Reanudar
- [ ] UI responsiva

## Variables de Entorno
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
NEXT_PUBLIC_REDIRECT_URI=...
NEXT_PUBLIC_APP_URL=...
