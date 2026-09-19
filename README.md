# menu-custom-service (Platanópolis)

Sistema local de pedidos de menú: armar pedido → cobrar con vuelto → aviso WhatsApp.
Un operador (celular), acceso por **Tailscale**, sin nube ni dominio público.

## ¿Está cubierto `requerimientos-monorepo.md`?

| ID | Estado |
|----|--------|
| RF-01 … RF-10 | Cubiertos (menú/seed, armado, nombre, cobro, confirmar, WhatsApp, historial, base + varias salsas, proteína condicional) |
| RNF-01 Persistencia SQLite | Cubierto (volumen `backend/data`) |
| RNF-02 Solo Tailscale | Cubierto operativamente (guía abajo; la app no se publica a internet) |
| RNF-03 Mobile-first | Cubierto |
| RNF-04 Precios congelados | Cubierto |
| RNF-05 `docker compose up` | Cubierto (seed al arrancar el contenedor backend) |

Criterio de éxito pendiente de **probar en campo**: pedido completo desde el celular con datos móviles (paso 11 de los requisitos).

## Documentación

| Área | Documento |
|------|-----------|
| Tailscale (esta guía) | sección [Acceso con Tailscale](#acceso-con-tailscale) |
| Docker | [DOCKER.md](DOCKER.md) |
| Backend / Bruno | [backend/README.md](backend/README.md) |
| Frontend | [frontend/README.md](frontend/README.md) |
| Reglas de negocio | [backend/CONTEXT.md](backend/CONTEXT.md), [frontend/CONTEXT.md](frontend/CONTEXT.md) |
| Requisitos | [requerimientos-monorepo.md](requerimientos-monorepo.md) |

---

## Acceso con Tailscale

Objetivo: que el celular del operador abra la app por la VPN de Tailscale (`100.x.x.x`), **sin** estar en el WiFi del PC y **sin** exponer puertos a internet.

### 1. En el PC (servidor)

1. Instala [Tailscale](https://tailscale.com/download) para Windows.
2. Inicia sesión con la misma cuenta que usará el celular.
3. En una terminal:

```bash
tailscale up
tailscale ip -4
```

Anota la IP (ejemplo: `100.64.12.34`). Esa es la IP del PC en la red Tailscale.

4. Deja Docker (o el stack local) escuchando en el PC. Los puertos `5173` (UI) y `3000` (API) deben estar libres en el host.

### 2. Configurar `.env` con la IP Tailscale

```bash
cp .env.example .env
```

Edita `.env` en la raíz:

```env
WHATSAPP_TARGET_NUMBER=573XXXXXXXXX
VITE_API_BASE_URL=http://100.64.12.34:3000
```

- `VITE_API_BASE_URL` = IP Tailscale del **PC** + puerto del **backend** (`3000`).
- No uses `localhost` aquí si el celular va a llamar a la API: desde el teléfono `localhost` es el propio teléfono.

### 3. Levantar el stack (recomendado: Docker)

```bash
docker compose up --build
```

Importante: `VITE_API_BASE_URL` se **embebe en el build** del frontend. Si cambias la IP Tailscale, vuelve a construir:

```bash
docker compose up --build
```

### 4. En el celular (operador)

1. Instala la app **Tailscale** (Android / iOS).
2. Inicia sesión con la **misma cuenta** que el PC (o una cuenta del mismo tailnet / compartida).
3. Activa Tailscale (VPN encendida). Puedes usar **datos móviles**; no hace falta WiFi del local.
4. Abre en el navegador:

```text
http://100.64.12.34:5173
```

(sustituye por tu IP de `tailscale ip -4`).

5. Instálala como PWA:
   - Android Chrome: menú → **Instalar app** / **Agregar a pantalla de inicio**
   - iPhone Safari: Compartir → **Añadir a pantalla de inicio**

### 5. Comprobar que todo habla por Tailscale

| Desde el celular | URL | Qué es |
|------------------|-----|--------|
| UI | `http://<IP-PC>:5173` | Frontend |
| API (prueba) | `http://<IP-PC>:3000/menu` | Debe devolver JSON del menú |

Si la UI carga pero el menú queda vacío o hay error de red, casi siempre es `VITE_API_BASE_URL` mal puesto (sigue en `localhost`) o el frontend no se reconstruyó tras cambiar el `.env`.

### 6. WhatsApp (independiente de Tailscale)

1. Con el backend arriba, mira los logs: la primera vez sale un **QR**.
2. Escanéalo con el WhatsApp del teléfono que **envía**.
3. El destino del mensaje es solo `WHATSAPP_TARGET_NUMBER` en `.env` (cámbialo y reinicia si cambia el receptor).
4. La sesión queda en disco; no hace falta re-escanear en cada arranque (salvo que borres la sesión o desvincules el dispositivo).

### 7. Checklist día a día

1. PC encendido, Tailscale conectado, `docker compose up` (o ya en marcha).
2. Celular con Tailscale conectado (datos o WiFi da igual).
3. Abrir la PWA / `http://<IP-PC>:5173`.
4. Flujo: menú → pedido → cobro → confirmar → aviso WhatsApp / historial.

### Problemas frecuentes

| Síntoma | Qué revisar |
|---------|-------------|
| No carga la página | Tailscale ON en PC y celular; misma cuenta/tailnet; IP correcta; puerto 5173 |
| Página sí, menú no | `VITE_API_BASE_URL=http://<IP-PC>:3000` y `docker compose up --build` |
| WhatsApp “enviado” pero no llega | Sin número en `.env` usa fake; o QR no vinculado; mira logs del backend |
| Tras reiniciar el PC no hay menú | El seed corre al arrancar el contenedor; si usas solo `npm run dev`, ejecuta `npm run seed` en `backend/` |

---

## Desarrollo local (sin Docker)

```bash
# Backend
cd backend && npm install && npm run seed && npm run dev

# Frontend (otra terminal)
cd frontend && npm install && npm run dev
```

Para probar desde el celular con Tailscale en modo dev: pon la IP Tailscale en `frontend/.env` como `VITE_API_BASE_URL` y reinicia Vite.

## Docker (uso diario)

Setup una vez + guía WhatsApp/autoarranque: **[DOCKER.md](DOCKER.md)**.

```bash
cp .env.example .env   # solo la primera vez; pon IP Tailscale y WhatsApp
docker compose up --build -d
```

Después: abre Docker Desktop (o enciende el PC) y los contenedores vuelven solos.
Celular → `http://<IP-Tailscale>:5173`. QR de WhatsApp solo la primera vez
(sesión en `backend/wwebjs-session/`).
