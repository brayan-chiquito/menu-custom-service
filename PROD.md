# Producción — nube + VPN

La app queda lista para desplegar **detrás de HTTPS y VPN**. Este archivo es el
runbook. No abre puertos a internet por sí solo: eso lo hace quien administra el VPS.

## Antes del primer deploy

1. **Dos admins.** En `/usuarios` crea un segundo usuario con rol admin y clave fuerte.
   Si uno olvida la contraseña, el otro la cambia en esa pantalla.
2. **Clave del admin inicial** distinta del seed. En el servidor:

```bash
cd backend
npm run reset-admin -- 'NuevaClave1!'
```

3. **Backup** de `backend/data/menu.db` (ver abajo) antes de migrar o reconstruir.
4. En `.env` de prod:

```env
VITE_API_BASE_URL=/api
REQUIRE_AUTH=1
COOKIE_SECURE=1
ENFORCE_PROD_CONFIG=1
CORS_ORIGINS=https://tu-dominio
SESSION_TTL_HOURS=24
```

`ENFORCE_PROD_CONFIG=1` impide arrancar si falta HTTPS-cookie, auth o CORS.

## Levantar

Local (HTTP, puertos 3000 y 5173):

```bash
docker compose up --build -d
```

Prod (UI solo en `127.0.0.1:8080`, API sin puerto público). Compose v2.24+:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

La UI y la API comparten origen: el navegador llama `/api/...` y nginx reenvía al backend.
La sesión va en cookie `HttpOnly` (`COOKIE_SECURE=1` exige HTTPS).

## HTTPS + VPN

Ejemplo Caddy en el host (o en otro contenedor) con el frontend en el 8080:

```caddyfile
tu-dominio {
  reverse_proxy 127.0.0.1:8080
}
```

Firewall del VPS:

- 443 (y 80 solo para el reto TLS) **solo desde la VPN** o allowlist.
- No publiques `3000`.
- No uses `REQUIRE_AUTH=0`.

## Backup y restore

```powershell
powershell -File scripts/backup-db.ps1
```

Copia `backend/data/backups/menu-YYYYMMDD-HHMMSS.db`.

Restore (con el stack parado):

```powershell
docker compose stop
Copy-Item backend/data/backups/menu-YYYYMMDD-HHMMSS.db backend/data/menu.db -Force
docker compose start
```

Prueba el restore una vez en QA (`menu-qa.db`) antes de confiar en el de prod.

## Si se olvidan todos los admin

Quien tenga SSH al VPS:

```bash
cd backend && npm run reset-admin -- 'NuevaClave1!'
```

Eso cambia solo al usuario `admin` y cierra sus sesiones. No muestra la clave anterior (no se puede: está hasheada).

## Checklist de salida

- [ ] HTTPS en el dominio
- [ ] Firewall / VPN: 443 restringido, 3000 cerrado
- [ ] `ENFORCE_PROD_CONFIG=1` y el backend arranca
- [ ] Login en el navegador (cookie; no queda token en localStorage)
- [ ] Segundo admin creado
- [ ] Backup reciente y restore probado en QA
- [ ] Cocina se actualiza sola al crear un pedido
