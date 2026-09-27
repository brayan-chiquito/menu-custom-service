# menu-custom-service (Platanópolis)

Pedidos de menú para un local: armar pedido, cobrar, cocina en vivo.
Varios usuarios (hasta 10 sesiones), acceso por **VPN + HTTPS** en un VPS.
WhatsApp operativo está retirado: la cocina sustituye el aviso al preparador.

## Documentación

| Tema | Dónde |
|------|--------|
| Deploy nube / VPN, backup, dos admins | [PROD.md](PROD.md) |
| Docker día a día | [DOCKER.md](DOCKER.md) |
| API y Bruno | [backend/README.md](backend/README.md) |
| Pantallas | [frontend/README.md](frontend/README.md) |
| Requisitos | [requerimientos-monorepo.md](requerimientos-monorepo.md) |

## Qué hace hoy

- Login (cookie httpOnly; el token no se guarda en el navegador).
- Menú, pedido, cobro con vuelto, historial, balance y egresos.
- Cocina en vivo (cola del día + «Listo»).
- Admin: usuarios, seguimiento, catálogo.
- Rate-limit de login (5 fallos / minuto por IP) y sesión de 24 h.

## Desarrollo local

```bash
# Backend
cd backend && npm install && npm run seed && npm run dev

# Frontend (otra terminal) — proxy /api → :3000
cd frontend && npm install && npm run dev
```

QA (no toca `menu.db` de prod): frontend `--mode qa` en `:5174` y backend en `:3001` con `data/menu-qa.db`. El proxy de Vite en modo qa apunta a `:3001`.

Login de QA si se sembró con el ejemplo: `admin` / `Admin123!`. Cámbiala antes de prod (`npm run reset-admin`).

## Docker

```bash
cp .env.example .env
docker compose up --build -d
```

UI en `http://localhost:5173` (mismo origen, `/api` va al backend). Prod: [PROD.md](PROD.md).

## Antes de producción

1. Segundo usuario **admin** en `/usuarios`.
2. Contraseña del admin distinta del seed.
3. Backup de la base (`scripts/backup-db.ps1`).
4. HTTPS + VPN y `ENFORCE_PROD_CONFIG=1` (el proceso no arranca si falta).
