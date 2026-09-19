# Docker — menu-custom-service

Objetivo: **abrir Docker Desktop** y que backend + frontend + sesión WhatsApp
sigan arriba sin pasos diarios (salvo el primer QR de WhatsApp).

## Una sola vez (setup)

1. Docker Desktop instalado y “Start Docker Desktop when you sign in” activado
   (Settings → General).
2. `.env` en la raíz del monorepo:

```bash
cp .env.example .env
```

```env
WHATSAPP_TARGET_NUMBER=573116508052
VITE_API_BASE_URL=http://100.119.141.96:3000
```

(`VITE_API_BASE_URL` = IP Tailscale del PC + `:3000`. Si cambia la IP, edita y
vuelve a construir el frontend.)

3. Desde la raíz del repo (libera puertos 3000/5173 si tenías `npm run dev`):

```bash
docker compose up --build -d
```

4. Primera vez WhatsApp — mira el QR en los logs:

```bash
docker compose logs -f backend
```

Busca la línea `Abre esta URL en el PC y escanea la imagen:` y ábrela en el
navegador; escanea esa imagen con el WhatsApp del teléfono que **envía**.
Cuando veas `[WhatsApp] Cliente listo`, puedes cerrar los logs (`Ctrl+C`).
La sesión queda en `backend/wwebjs-session/` (volumen); **no** hace falta
escanear otra vez al reiniciar el PC o Docker.

## Día a día

1. Enciende el PC → Docker Desktop arranca solo (si lo configuraste).
2. Los contenedores con `restart: unless-stopped` vuelven solos.
3. Celular: Tailscale ON → `http://<IP-Tailscale-PC>:5173`.

Si algo no levantó:

```bash
docker compose up -d
docker compose ps
```

## Comandos útiles

| Acción | Comando |
|--------|---------|
| Ver estado | `docker compose ps` |
| Logs backend / QR | `docker compose logs -f backend` |
| Parar | `docker compose stop` |
| Arrancar de nuevo | `docker compose start` |
| Reconstruir (cambio de código o `VITE_API_BASE_URL`) | `docker compose up --build -d` |
| Cambiar solo destino WhatsApp | edita `WHATSAPP_TARGET_NUMBER` en `.env` → `docker compose up -d` (sin rebuild) |

Al reconstruir: la migración **v3→v4** hace `base_id` nullable **sin borrar pedidos**;
el seed solo hace **upsert** del menú (ej. Limonada de maracuyá). No borres
`backend/data/` salvo que quieras resetear prod a propósito.

## Volúmenes (no borrar)

| Host | Contenedor | Qué guarda |
|------|------------|------------|
| `backend/data/` | `/app/data` | SQLite (pedidos, menú) |
| `backend/wwebjs-session/` | `/app/.wwebjs_auth` | Sesión WhatsApp |

Si borras `wwebjs-session`, tendrás que escanear el QR otra vez.

## Puertos

| Servicio | Host | Contenedor |
|----------|------|------------|
| backend | 3000 | 3000 |
| frontend | 5173 | 80 (nginx) |

## Bruno

1. `docker compose up -d`
2. Colección `backend/bruno/`, `baseUrl = http://localhost:3000`
3. Seed automático al arrancar el backend.

Guía Tailscale: [README.md — Acceso con Tailscale](README.md#acceso-con-tailscale).
