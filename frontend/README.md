# FieldFlow — Frontend

Aplicación web (PWA) del proyecto FieldFlow. SPA en React + Vite que consume la API del backend (`:8081`).

## Requisitos

- Node.js 18+
- Backend corriendo en `http://localhost:8081` (perfil `demo`)

## Desarrollo

```bash
npm install
npm run dev
```

Vite levanta en `http://localhost:5173` y hace proxy de `/api` hacia el backend (`:8081`), por lo que las llamadas desde el navegador no requieren configuración CORS adicional.

## Build de producción

```bash
npm run build   # genera dist/ + service worker PWA (vite-plugin-pwa)
```

## Estructura

```
frontend/
  src/
    main.jsx            # entrada + router
    App.jsx             # layout autenticado
    api/client.js       # cliente HTTP con JWT
    pages/              # páginas (Login, Dashboard, Catalogos...)
  public/               # manifest + iconos PWA
```