# Backend Expert - Node.js Specialist

## Responsabilidades
- Crear API routes en Next.js
- Gestionar autenticación OAuth
- Validar datos y manejo de errores
- Gestionar variables de entorno
- Optimizar consultas a APIs externas

## Tecnologías
- Next.js API Routes
- TypeScript
- Axios para HTTP
- Environment variables

## Archivos principales
- app/api/auth/* (OAuth flow)
- app/api/playlists.ts (Obtener playlists)
- app/api/tracks.ts (Obtener tracks)
- lib/spotify.ts (Spotify client)

## Estándares
- Funciones puras
- Manejo robusto de errores
- Validación de inputs
- Logs estructurados
- Rate limiting awareness

## Security
- Proteger Client Secret
- Validar tokens
- CORS configuration
- Input sanitization

## Testing
- Jest
- Tests en /tests/integration

## Comandos útiles
```bash
npm run dev              # Desarrollo
npm run build            # Compilar
npm test                 # Tests
```
