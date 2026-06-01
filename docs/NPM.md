# Guía de npm

## Comandos comunes

```bash
# Instalar todas las dependencias
npm install

# Agregar un paquete
npm install nombre-paquete
npm install --save-dev nombre-paquete  # Dev dependency

# Remover un paquete
npm uninstall nombre-paquete

# Ejecutar scripts definidos en package.json
npm run dev
npm test
npm run build

# Listar dependencias instaladas
npm list
npm list --depth=0

# Actualizar paquetes
npm update
npm update nombre-paquete

# Ver la versión de npm
npm --version
```

## Scripts disponibles en package.json

```bash
npm run dev              # Servidor de desarrollo
npm run build            # Compilar para producción
npm start                # Iniciar servidor de producción
npm test                 # Ejecutar tests
npm test -- --watch     # Tests en modo watch
npm test -- --coverage  # Reporte de cobertura
npm run lint             # ESLint
```

## Equivalencias comunes

| Acción | npm |
|--------|-----|
| Instalar | npm install |
| Agregar | npm install pkg |
| Remover | npm uninstall pkg |
| Dev | npm install --save-dev pkg |
| Update | npm update |
| Global | npm install -g pkg |
