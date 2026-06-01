# Guía de Agentes Especializados

## Cómo usar los agentes con Claude Code CLI

### Frontend Expert
```bash
claude code --agent frontend-expert --task "Crear componente PlaylistSelector"
```

### Backend Expert
```bash
claude code --agent backend-expert --task "Implementar endpoint /api/playlists"
```

### Test Expert
```bash
claude code --agent test-expert --task "Escribir tests para PlaylistSelector"
```

### Spotify Expert
```bash
claude code --agent spotify-expert --task "Implementar OAuth callback"
```

## Flujo de desarrollo recomendado

1. **Backend Expert** → Crear API routes
2. **Spotify Expert** → Integrar con Spotify API
3. **Frontend Expert** → Crear componentes UI
4. **Test Expert** → Escribir tests para todo

## Comunicación entre agentes
Los agentes están conectados a través de:
- Variables de entorno compartidas (.env.local)
- Types compartidos (TypeScript interfaces)
- Convenciones de naming
- Documentación en /docs
