# Requerimientos del proyecto — Monorepo

## 1. Creación del monorepo

```
mkdir pedidos-app && cd pedidos-app
git init
mkdir backend frontend
touch docker-compose.yml .gitignore README.md
```

`.gitignore` (raíz):
```
node_modules/
dist/
build/
*.db
.env
.wwebjs_auth/
.wwebjs_cache/
```

Estructura final esperada:
```
pedidos-app/
  backend/
    README.md
    src/
    package.json
    Dockerfile
  frontend/
    README.md
    src/
    package.json
    Dockerfile
  pencilux/
  docker-compose.yml
  DOCKER.md
  .env
  .gitignore
  README.md
  requerimientos-monorepo.md
```

## 2. Alcance
Sistema local de gestión de pedidos de menú: armado de pedido con
cantidades y adiciones, cálculo de total, cobro con vuelto (inmediato
o diferido), historial del día con detalle, balance de ventas simple,
y aviso por WhatsApp al confirmar el pago. Un solo operador (celular),
acceso remoto vía Tailscale, sin nube, sin dominio.

## 3. Requerimientos funcionales
(fuente de verdad del producto)

- RF-01 Gestión de menú (productos y adiciones; menú vía seed)
- RF-02 Armado de pedido con cálculo de total en tiempo real
- RF-03 Nombre de cliente opcional → `"Sin nombre"` por defecto
- RF-04 Cobro con validación de monto y cálculo de vuelto
- RF-05 Confirmación explícita de pago (cambia estado a `pagado`)
- RF-06 Notificación automática por WhatsApp al confirmar el pago,
  sin bloquear el flujo si falla (mensaje listo para copiar si falla)
- RF-07 Historial de pedidos del día (filtros Todos/Pendientes/Pagados)
- RF-08 En platos, cada ítem requiere **base** (Maduro/Verde). Las
  **salsas** (Ajo/Agridulce/Ranchera/BBQ) son **opcionales** (0 o más),
  sin costo. Toppings opcionales con costo. Las **bebidas**
  (`categoria = bebidas`, ej. Limonada de maracuyá) no usan base ni
  salsa ni proteína
- RF-09 El menú real (Platanópolis) se carga mediante seed (upsert por
  `nombre`, sin duplicar; permite corregir datos)
- RF-10 Solo productos con `requiere_proteina` exigen Carne o Pollo;
  el resto no muestra ni exige proteína
- RF-11 Pedido pendiente: se puede **guardar sin pagar** y cobrar
  después desde Historial (`/cobro/:id`)
- RF-12 Detalle de pedido en Historial (ítems, extras, monto/vuelto si
  pagado) vía `GET /pedidos/:id`
- RF-13 Balance de ventas simple: cobrado / pedidos / ticket / pendiente
  por periodo Hoy | Semana (lunes→hoy) | Mes

## 4. Requerimientos no funcionales
- RNF-01 Persistencia en disco (SQLite), sin pérdida de pedidos ante
  reinicios
- RNF-02 Acceso remoto solo por Tailscale, sin exposición pública
- RNF-03 UI mobile-first, botones ≥48px, un solo foco visual en Cobro
- RNF-04 Precios congelados por pedido (histórico), no afectados por
  cambios posteriores en el catálogo
- RNF-05 Todo el stack ejecutable con `docker compose up` en un único
  comando
- RNF-06 Migraciones de esquema no deben borrar pedidos de producción
  (ej. v3→v4: `base_id` nullable sin DROP de datos)

## 5. Backend (resumen — detalle operativo en `backend/README.md`)
- Node.js + TypeScript + Express, capas `controller → service → repository`
- SQLite vía `better-sqlite3`
- `whatsapp-web.js` con sesión persistida en volumen
- Notificaciones detrás de interfaz `Notificador` (Fake o WhatsApp)
- Catálogos: `bases`, `salsas`, `proteinas`, `adiciones`; productos con
  `categoria` (`platos` | `bebidas`) y `requiere_proteina`
- Endpoints:
  - `GET /menu`
  - `POST /pedidos` (platos: base obligatoria, salsas opcionales;
    bebidas: sin base/salsa)
  - `GET /pedidos?fecha=hoy`
  - `GET /pedidos/:id` (detalle con `lineas`)
  - `GET /pedidos/balance?periodo=hoy|semana|mes`
  - `PATCH /pedidos/:id/pago`
  - `PATCH /pedidos/:id/confirmar`
- Script `seed/seed.ts` (upsert + rename legacy si aplica)

## 6. Frontend (resumen — detalle operativo en `frontend/README.md`)
- React + Vite + TypeScript, PWA instalable
- Por feature: hook con lógica + componente de solo render
- Capa `shared/api` única para llamadas HTTP
- Pantallas: Armar pedido, Resumen, Cobro (inmediato y diferido),
  Historial (Detalles + Cobrar + Balance), Balance
- `VITE_API_BASE_URL` configurable por `.env` (IP de Tailscale + puerto)

## 7. Docker Compose (raíz del monorepo)

```yaml
services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    volumes:
      - ./backend/data:/app/data          # SQLite
      - ./backend/wwebjs-session:/app/.wwebjs_auth   # sesión WhatsApp
    environment:
      - WHATSAPP_TARGET_NUMBER=${WHATSAPP_TARGET_NUMBER}
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "5173:80"
    environment:
      - VITE_API_BASE_URL=${VITE_API_BASE_URL}
    depends_on:
      - backend
    restart: unless-stopped
```

`.env` (raíz, no versionado):
```
WHATSAPP_TARGET_NUMBER=573XXXXXXXXX
VITE_API_BASE_URL=http://100.x.x.x:3000
```

`restart: unless-stopped` es clave para las 2 días de uso continuo: si
el PC hace hibernación/sleep accidental o el proceso muere, Docker lo
vuelve a levantar solo.

## 8. Tailscale (fuera de Docker, en el host)

```
# Instalar Tailscale en el PC (no en un contenedor)
tailscale up
tailscale ip          # esta IP va en VITE_API_BASE_URL
```

El celular de la esposa: instalar app Tailscale, loguear con la misma
cuenta, y abrir `http://<IP-tailscale-PC>:5173` desde el navegador →
"Agregar a inicio" para que se sienta como app instalada.

## 9. Orden de implementación recomendado (para no perder tiempo)
1. Scaffold del monorepo + docker-compose base (contenedores levantan
   aunque no tengan lógica aún)
2. Backend: modelo de datos completo (productos con
   `requiere_proteina`, bases, salsas, proteinas, adiciones) +
   endpoint `/menu`
3. Backend: script de seed con los datos reales de Platanópolis
   (flags de proteína incluidos; permite corregir el menú sin
   duplicar registros)
4. Backend: endpoint de creación de pedido (base obligatoria en platos,
   salsas opcionales, proteína condicional, bebidas sin customización)
5. Backend: endpoint de pago/vuelto + confirmación
6. Backend: integración WhatsApp (dejar esto de último si el tiempo
   aprieta — RF-06 puede diferirse un rato sin bloquear el uso real)
7. Frontend: Armar pedido + Resumen + Cobro (inmediato)
8. Frontend: Historial, pedidos pendientes, Detalles, Balance
9. Tailscale + prueba real desde el celular fuera de la red del PC

## 10. Criterios de éxito
- `docker compose up` levanta todo con un solo comando, sin pasos
  manuales adicionales salvo escanear el QR de WhatsApp la primera vez.
- Un pedido completo (armar → cobrar → confirmar) funciona de punta a
  punta desde el celular por Tailscale, con la red de datos móviles
  del celular (no WiFi del PC).
- Un reinicio del PC no pierde pedidos ya guardados ni requiere
  reconfigurar el `.env`.
