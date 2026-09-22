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
o diferido), historial paginado con detalle, balance de ventas simple,
egresos, **ajuste del catálogo (CRUD)** y aviso por WhatsApp al confirmar
el pago. **Varios operadores concurrentes** (hasta 10 sesiones
simultáneas) con inicio de sesión e identidad en las gestiones; un
rol **admin** además gestiona usuarios y consulta el seguimiento/
auditoría. Acceso remoto vía Tailscale, sin nube, sin dominio.

## 3. Requerimientos funcionales
(fuente de verdad del producto)

- RF-01 Gestión de menú: productos y adiciones; carga inicial vía seed;
  en operación se administran desde **Ajustes** (crear / editar / eliminar)
- RF-02 Armado de pedido con cálculo de total en tiempo real
- RF-03 Nombre de cliente opcional → `"Sin nombre"` por defecto
- RF-04 Cobro con validación de monto y cálculo de vuelto
- RF-05 Confirmación explícita de pago (cambia estado a `pagado`)
- RF-06 Notificación automática por WhatsApp al confirmar el pago,
  sin bloquear el flujo si falla (mensaje listo para copiar si falla)
- RF-07 Historial de pedidos (todos los días, paginado 10 + Cargar más;
  filtros Todos/Pendientes/Pagados/Eliminados; medio Efectivo/Transfer
  si pagado; Restaurar en eliminados — RF-19)
- RF-08 En platos, cada ítem requiere **base** (Maduro/Verde). Las
  **salsas** (Ajo/Agridulce/Ranchera/BBQ) son **opcionales** (0 o más),
  sin costo. Toppings opcionales con costo. Las **bebidas**
  (`categoria = bebidas`, ej. Limonada de maracuyá) no usan base ni
  salsa ni proteína
- RF-09 El menú real (Platanópolis) se carga mediante seed (upsert por
  `nombre`, sin duplicar; permite corregir datos). Los cambios posteriores
  se hacen por Ajustes (RF-16)
- RF-10 Solo productos con `requiere_proteina` exigen Carne o Pollo;
  el resto no muestra ni exige proteína
- RF-11 Pedido pendiente: se puede **guardar sin pagar** y cobrar
  después desde Historial (`/cobro/:id`)
- RF-12 Detalle de pedido en Historial (ítems, extras, monto/vuelto si
  pagado) vía `GET /pedidos/:id`
- RF-13 Balance: cobrado (total), desglose efectivo vs transferencia,
  gastos/egresos del periodo, y **ganancia** = cobrado − gastos
  (periodos Hoy | Semana lun→hoy | Mes)
- RF-14 Egresos/gastos de insumos: registrar nombre, precio unitario y
  cantidad; total del egreso = precio × cantidad; visibles en Balance
- RF-15 En cobro, checkbox **Transferencia**; si no se marca, el pago
  cuenta como efectivo (físico). Si Transferencia está marcada, el monto
  recibido se fija al total y el input se bloquea
- RF-16 Ajustes de catálogo: desde Menú (icono ⚙) se administran con
  **CRUD completo** (crear / editar / eliminar, con confirmación):
  **productos**, **toppings/adiciones**, **bases**, **salsas** y
  **proteínas**. No alterar precios de pedidos ya creados
- RF-17 Historial: desde el detalle de un pedido se puede **eliminar**
  (soft-delete con `eliminado_at`, confirmación; no hard delete) o
  **editar**. Soft-deleted no entran en listado ni balance (datos
  permanecen en DB). Editar `nombre_cliente` e **ítems** en
  `pendiente` y `pagado`. Si `pagado` cambia ítems: recalcular `total`
  y ajustar pago — transferencia → `monto_pagado=total`, `vuelto=0`;
  si no y `monto_pagado < total` → `monto_pagado=total`, `vuelto=0`;
  si no → `vuelto = monto_pagado − total`
- RF-18 Indicaciones especiales opcionales en el pedido (`indicaciones`):
  checkbox off por defecto; al activar, texto libre (ej. sin X / +Y).
  No van en el nombre del cliente. Si hay texto, aparecen en Detalles y
  en el mensaje de WhatsApp / Copiar pedido
- RF-19 Historial: filtro **Eliminados** (soft-deleted) y acción
  **Restaurar** (limpia `eliminado_at`). Mientras estén eliminados no
  cuentan en balance; al restaurar vuelven al listado normal
- RF-20 Exportar balance: desde Balance, descargar **Excel (.xlsx)** del
  periodo (Hoy/Semana/Mes) con hojas Resumen / Pedidos / Egresos,
  AutoFilter y formato listo (sin CSV ni formateo manual). No incluye
  importar archivos externos a la app
- RF-21 Alertas de error: si falla red o una acción crítica (crear/
  guardar/cobrar pedido, editar/eliminar, exportar, egresos, ajustes),
  mostrar alerta visible (cerrar con ✕) con mensaje en español. **No**
  alertas de éxito en el happy path (el cambio de pantalla basta). Se
  mantiene el banner existente de WhatsApp no enviado
- RF-22 Autenticación y usuarios: inicio de sesión obligatorio
  (usuario + contraseña). Roles: **operador** y **admin**. Hasta
  **10 sesiones concurrentes**. Todos ven los mismos pedidos y datos
  operativos (menú, historial, balance, egresos, ajustes de catálogo).
  Cada gestión relevante queda asociada al usuario que la realizó
  (crear/editar/cobrar/eliminar/restaurar pedido, egresos, cambios de
  catálogo). Admin además: **gestión de usuarios** (CRUD: crear,
  activar/desactivar, rol, reset de clave) y pantalla de
  **Seguimiento / consultoría** (auditoría: quién hizo qué y cuándo).
  Convivencia multi-usuario: evitar choques (p. ej. editar el mismo
  pedido a la vez → aviso / conflicto claro); sin aislamiento de
  datos por usuario
- RF-23 Cocina / órdenes a preparar: vista para el cocinero (y el
  resto de usuarios autenticados) con los pedidos **pendientes de
  cobrar** y **pagados** que aún no están marcados como preparados.
  Muestra cliente, ítems, indicaciones y estado de pago. Acción
  **Listo** (marca preparado; sale de la cola activa). La vista se
  **actualiza sola** (sin recargar a mano) cuando un pedido pasa a
  pendiente o a pagado, cuando se edita, se elimina o se marca listo
- RF-24 WhatsApp en Ajustes: estado de la sesión del teléfono que
  **envía**. Si está bien → **Activa**. Si no → **No activa** y se
  muestra el **QR** para escanear. Los números **destino** (a quién
  se envía el aviso) ya no van fijos en `.env`: se administran en
  esa vista (uno o varios). Cambiar destinos **no** cierra la sesión
  de WhatsApp. La sesión debe mantenerse iniciada el mayor tiempo
  posible (volumen en disco, reconexión; no pedir QR si ya está
  vinculada)

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
  (ej. v3→v4 `base_id` nullable; v4→v5 egresos + `es_transferencia`)
- RNF-07 Sesiones autenticadas; límite de 10 concurrentes con mensaje
  claro si se excede; contraseñas no en texto plano
- RNF-08 Acciones de escritura deben ser seguras ante concurrencia
  (conflicto detectable y mensaje en español; sin corrupción de datos)
- RNF-09 Cola de cocina en vivo (push); la sesión WhatsApp persiste
  en disco y se reintenta reconectar; destinos editables sin borrar
  la sesión

## 5. Backend (resumen — detalle operativo en `backend/README.md`)
- Node.js + TypeScript + Express, capas `controller → service → repository`
- SQLite vía `better-sqlite3`
- `whatsapp-web.js` con sesión persistida en volumen
- Notificaciones detrás de interfaz `Notificador` (Fake o WhatsApp)
- Catálogos: `bases`, `salsas`, `proteinas`, `adiciones`; productos con
  `categoria` (`platos` | `bebidas`) y `requiere_proteina`
- Endpoints:
  - Auth / usuarios (RF-22): `POST /auth/login`, `POST /auth/logout`,
    `GET /auth/me`; admin: CRUD `/usuarios`; `GET /auditoria` (seguimiento)
  - Cocina (RF-23): cola de pedidos por preparar + stream en vivo +
    marcar preparado
  - WhatsApp (RF-24): estado de sesión (y QR si no está activa) +
    CRUD de números destino (no rompe la sesión)
  - `GET /menu`
  - `POST /pedidos` (platos: base obligatoria, salsas opcionales;
    bebidas: sin base/salsa; asocia `usuario_id` del actor)
  - `GET /pedidos?limit=&offset=&estado=` (historial paginado)
  - `GET /pedidos?fecha=hoy` (compat: solo día Bogotá)
  - `GET /pedidos/:id` (detalle con `lineas`)
  - `GET /pedidos/balance?periodo=hoy|semana|mes` (ventas efectivo/
    transferencia, gastos, ganancia)
  - `GET /pedidos/balance/export?periodo=hoy|semana|mes` (Excel .xlsx —
    RF-20)
  - `PATCH /pedidos/:id/pago` (body: `monto_pagado`, `es_transferencia?`)
  - `PATCH /pedidos/:id/confirmar`
  - `PATCH /pedidos/:id` (editar: `nombre_cliente` + ítems en pendiente/pagado;
    si pagado, recalcula total y ajusta monto/vuelto — RF-17)
  - `DELETE /pedidos/:id` (soft-delete: `eliminado_at`; excluido de listado/
    balance — RF-17)
  - `GET /pedidos?eliminados=1` (listar soft-deleted — RF-19)
  - `PATCH /pedidos/:id/restaurar` (limpia `eliminado_at` — RF-19)
  - `POST /egresos`, `GET /egresos?periodo=hoy|semana|mes`
  - CRUD catálogo (RF-16): productos, adiciones, bases, salsas, proteinas
- Script `seed/seed.ts` (upsert + rename legacy si aplica)

## 6. Frontend (resumen — detalle operativo en `frontend/README.md`)
- React + Vite + TypeScript, PWA instalable
- Por feature: hook con lógica + componente de solo render
- Capa `shared/api` única para llamadas HTTP
- Pantallas: **Login** (RF-22), Armar pedido (⚙ → Ajustes; chip de
  usuario + cerrar sesión), Resumen (nombre + indicaciones opcionales
  RF-18), Cobro (inmediato y diferido + checkbox transferencia),
  Historial (filtros + Eliminados/Restaurar RF-19 + Detalles +
  Editar/Eliminar RF-17 + Cobrar + Balance), Balance (exportar Excel
  RF-20), Egresos, **Ajustes de menú** (CRUD catálogo, RF-16). Solo
  **admin**: Usuarios (CRUD) y **Seguimiento / consultoría**.
  **Cocina** (cola en vivo + Listo — RF-23). Ajustes:
  **WhatsApp** (estado/QR + números destino — RF-24). Errores
  de acción/red/conflicto/sesión con alerta visible (RF-21 / RF-22)
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
- Varios operadores pueden trabajar a la vez (hasta 10) con login;
  queda registro de quién hizo cada gestión; admin gestiona usuarios
  y consulta el seguimiento.
- El cocinero ve la cola y la marca lista sin recargar a mano.
- En Ajustes se ve si WhatsApp está activo (o el QR) y se editan
  los números destino sin perder la sesión.
