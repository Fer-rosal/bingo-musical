# Spotify Expert - Integration Specialist

## Responsabilidades
- Integración con Spotify Web API
- Spotify OAuth 2.0 flow
- Reproducción con Web Playback SDK
- Gestión de playlists y tracks
- Handling de errores de Spotify

## Tecnologías
- Spotify Web API
- Spotify Web Playback SDK
- spotify-web-api-js
- Axios

## Archivos principales
- lib/spotify.ts (Cliente Spotify)
- app/api/auth/login.ts
- app/api/auth/callback.ts
- app/api/playlists.ts
- utils/spotify/* (Helpers)

## Endpoints a implementar
- GET /api/auth/login - Iniciar OAuth
- GET /api/auth/callback - Callback OAuth
- GET /api/playlists - Obtener playlists
- GET /api/playlist/[id] - Detalles playlist
- POST /api/playback - Control de reproducción

## Estándares
- Manejo robusto de tokens
- Refresh tokens automático
- Rate limiting (180K/hora)
- Caché de playlists
- Error handling específico de Spotify

## Spotify Rate Limits
- 180,000 requests/hora
- Implementar retry logic
- Caché cuando sea posible

## Comandos útiles
```bash
npm run dev              # Desarrollo
npm test                 # Tests
npm run build            # Compilar
```
