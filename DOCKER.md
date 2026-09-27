# Docker — menu-custom-service

Objetivo: `docker compose up` deja UI + API + SQLite arriba.
La UI llama a `/api` en el mismo origen; nginx reenvía al backend.
WhatsApp operativo **no** se usa (Cocina avisa al preparador).

## Una sola vez

1. Docker Desktop instalado.
2. `.env` en la raíz:

```bash
cp .env.example .env
```

`VITE_API_BASE_URL=/api` (ya es el default del build). No pongas `http://localhost:3000`: la cookie de sesión no viajaría.

3. Desde la raíz:

```bash
docker compose up --build -d
```

4. Abre `http://localhost:5173` e inicia sesión.

## Día a día

1. Enciende el PC → Docker Desktop (si arranca con Windows).
2. Los contenedores con `restart: unless-stopped` vuelven solos.
3. Navegador → `http://localhost:5173` (en la nube, la URL HTTPS de la VPN; ver [PROD.md](PROD.md)).

```bash
docker compose up -d
docker compose ps
```

## Comandos

| Acción | Comando |
|--------|---------|
| Ver estado | `docker compose ps` |
| Logs | `docker compose logs -f backend` |
| Parar | `docker compose stop` |
| Arrancar | `docker compose start` |
| Reconstruir | `docker compose up --build -d` |
| Prod (HTTPS/VPN) | `docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d` |
| Backup de la base | `powershell -File scripts/backup-db.ps1` |
| Reset clave admin | `cd backend && npm run reset-admin -- 'NuevaClave1!'` |

Al reconstruir, las migraciones no borran pedidos. El seed hace upsert del menú. No borres `backend/data/` salvo reset a propósito.

## Volúmenes

| Host | Contenedor | Qué guarda |
|------|------------|------------|
| `backend/data/` | `/app/data` | SQLite (pedidos, usuarios, menú) |

## Puertos (compose local)

| Servicio | Host | Contenedor |
|----------|------|------------|
| backend | 3000 | 3000 |
| frontend | 5173 | 80 (nginx + proxy `/api`) |

En prod el overlay no publica el 3000 y deja la UI en `127.0.0.1:8080`.

## Bruno

1. `docker compose up -d`
2. Colección `backend/bruno/`, `baseUrl = http://localhost:3000`
3. Login devuelve token Bearer para Bruno. El navegador usa la cookie, no ese token.
