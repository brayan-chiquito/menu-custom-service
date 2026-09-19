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
    CONTEXT.md
    src/
    package.json
    Dockerfile
  frontend/
    CONTEXT.md
    src/
    package.json
    Dockerfile
  prompts-ux.md
  prompts-cursor.md
  docker-compose.yml
  .env
  .gitignore
  README.md
```

## 2. Alcance
Sistema local de gestión de pedidos de menú: armado de pedido con
cantidades y adiciones, cálculo de total, cobro con vuelto, y aviso
por WhatsApp al confirmar el pago. Un solo operador (celular),
acceso remoto vía Tailscale, sin nube, sin dominio.

## 3. Requerimientos funcionales
(idénticos a los ya definidos — se mantienen como fuente de verdad)

- RF-01 Gestión de menú (productos y adiciones, CRUD básico)
- RF-02 Armado de pedido con cálculo de total en tiempo real
- RF-03 Nombre de cliente opcional → `"Sin nombre"` por defecto
- RF-04 Cobro con validación de monto y cálculo de vuelto
- RF-05 Confirmación explícita de pago (cambia estado a `pagado`)
- RF-06 Notificación automática por WhatsApp al confirmar el pago,
  sin bloquear el flujo si falla
- RF-07 Historial de pedidos del día
- RF-08 Cada unidad de producto en el pedido requiere elegir una base
  (Maduro/Verde) y una o más salsas (Ajo/Agridulce/Ranchera/BBQ), sin
  costo adicional; los toppings siguen siendo opcionales y con costo
- RF-09 El menú real (Platanópolis) se carga mediante un script de
  seed, no manualmente por el usuario, y ese mismo script debe
  permitir corregir datos del menú sin duplicar registros
- RF-10 Solo los productos marcados como `requiere_proteina` (ej.
  Candente, Chicharronero: “Carne o Pollo”) exigen elegir entre Carne
  y Pollo al armar el ítem. Los que ya traen ambas (ej. Apoteósico:
  “Carne y Pollo”) o una fija/ninguna no ofrecen ni exigen esa
  selección (`requiere_proteina = false`, `proteina_id` null)

## 4. Requerimientos no funcionales
- RNF-01 Persistencia en disco (SQLite), sin pérdida de pedidos ante
  reinicios
- RNF-02 Acceso remoto solo por Tailscale, sin exposición pública
- RNF-03 UI mobile-first, botones ≥48px, un solo foco visual en Cobro
- RNF-04 Precios congelados por pedido (histórico), no afectados por
  cambios posteriores en el catálogo
- RNF-05 Todo el stack ejecutable con `docker compose up` en un único
  comando

## 5. Backend (resumen ejecutable — detalle completo en `backend/CONTEXT.md`)
- Node.js + TypeScript + Express, capas `controller → service → repository`
- SQLite vía `better-sqlite3` o Prisma
- `whatsapp-web.js` con sesión persistida en volumen
- Notificaciones detrás de interfaz `Notificador` (SOLID: O y D)
- Tablas `bases`, `salsas` y `proteinas` como catálogos de referencia
  (`proteinas` solo obligatoria si `producto.requiere_proteina` es
  `true`, ej. Candente y Chicharronero); `adiciones` para los
  toppings (opcionales, con costo)
- Endpoints: `GET /menu` (productos + bases + salsas + proteinas +
  toppings), `POST /pedidos`, `PATCH /pedidos/:id/pago`,
  `PATCH /pedidos/:id/confirmar`, `GET /pedidos?fecha=hoy`
- Script `seed/seed.ts` para cargar y corregir los datos reales del
  menú (upsert por `nombre`, sin duplicar filas)

## 6. Frontend (resumen ejecutable — detalle completo en `frontend/CONTEXT.md`)
- Diseño de pantallas primero en **Pencil**, usando `prompts-ux.md`
  como guion de cada pantalla; la implementación en código parte de
  ese diseño, no al revés
- React + Vite + TypeScript, PWA instalable
- Por feature: hook con lógica + componente de solo render
- Capa `shared/api` única para llamadas HTTP
- Pantallas: Armar pedido, Resumen, Cobro, Historial
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
4. Backend: endpoint de creación de pedido con base, una o más salsas,
   proteína condicional y cálculo de total
5. Backend: endpoint de pago/vuelto + confirmación
6. Backend: integración WhatsApp (dejar esto de último si el tiempo
   aprieta — RF-06 puede diferirse un rato sin bloquear el uso real)
7. **Diseño UX en Pencil**: usar `prompts-ux.md` para maquetar las 4
   pantallas (Armar pedido, Resumen, Cobro, Historial) antes de tocar
   código de frontend. Esto se puede hacer en paralelo a los pasos
   2-6 (backend), pero debe estar listo antes del paso 8.
8. Frontend: pantalla Armar pedido conectada a `/menu`, construida a
   partir del diseño de Pencil del paso 7
9. Frontend: Resumen + Cobro conectados a los endpoints de pedido,
   igualmente a partir de los diseños de Pencil
10. Frontend: Historial del día
11. Tailscale + prueba real desde el celular fuera de la red del PC

## 10. Criterios de éxito
- `docker compose up` levanta todo con un solo comando, sin pasos
  manuales adicionales salvo escanear el QR de WhatsApp la primera vez.
- Un pedido completo (armar → cobrar → confirmar) funciona de punta a
  punta desde el celular por Tailscale, con la red de datos móviles
  del celular (no WiFi del PC).
- Un reinicio del PC no pierde pedidos ya guardados ni requiere
  reconfigurar el `.env`.
