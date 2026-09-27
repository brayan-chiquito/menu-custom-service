# Frontend — menu-custom-service

PWA React + Vite + TypeScript para tomar pedidos (mobile-first).

## Arranque

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

`VITE_API_BASE_URL=/api` (mismo origen). Vite hace proxy a `:3000`, o a `:3001` con `npx vite --mode qa`. La sesión va en cookie; no se guarda el token.

## Tests

```bash
npm test
```

## Rutas

| Ruta | Feature |
|------|---------|
| `/` | Menú + modal (platos: base obligatoria, salsas opcionales; bebidas: agregar directo) |
| `/resumen` | Pedido actual (+ Guardar sin pagar) |
| `/cobro` | Pago desde carrito (+ Transferencia); al pagar: éxito + «Nuevo pedido» y redirect ~3.5s |
| `/cobro/:pedidoId` | Cobrar un pedido ya guardado (pendiente) |
| `/historial` | Todos los días (+ Cargar más, badges, Detalles, Eliminados/Restaurar, Balance) |
| `/historial/:id/editar` | Editar nombre, ítems e indicaciones (pendiente o pagado) |
| `/balance` | Ventas, efectivo/transfer, gastos, ganancia (Hoy/Semana/Mes) |
| `/egresos` | Registrar gasto (nombre, precio, cantidad) + lista del periodo |
| `/ajustes` | Hub: Usuarios/Seguimiento (admin), catálogo |
| `/ajustes/productos` | CRUD productos (`requiere_proteina` opcional por plato) |
| `/ajustes/toppings` | CRUD toppings (nombre, precio) |
| `/ajustes/bases` · `/salsas` · `/proteinas` | CRUD por nombre |
| `/login` | Login (usuario + contraseña) |
| `/cocina` | Cola de órdenes en vivo (SSE) + Listo |
| `/usuarios` · `/usuarios/nuevo` · `/usuarios/:id` | Gestión usuarios (solo admin) |
| `/seguimiento` | Auditoría quién/qué/cuándo (solo admin) |

## Pedidos pendientes

1. En **Resumen**: “Guardar sin pagar” → `POST /pedidos` → Historial (filtro Pendientes).
2. En **Historial**: “Cobrar” → `/cobro/:id` → solo pago + confirmar.
3. “Ir a cobrar” sigue siendo el flujo inmediato (crear + pagar + confirmar).

## Menú / armado

- Platos: base obligatoria; salsas 0+; proteína solo si `requiere_proteina`.
- Bebidas (ej. Limonada de maracuyá): sin base/salsa/proteína.

## Tareas

### Task 7 — Pencil
Ver `pencilux/UX-Menu.pen` (guion UX local si aplica).

### Task 8 — Menú
`features/menu` + `shared/api/menuApi.ts` → `GET /menu`.

### Task 9 — Resumen + Cobro
`pedido-actual` + `cobro` → POST/PATCH pago/confirmar; pantalla «Pedido pagado» con contador ~4s y redirect (sin Copiar; Cocina reemplaza el aviso de prep).

### Task 10 — Historial
`historial` → `GET /pedidos?fecha=hoy`.

### Task 11 — PWA
`vite-plugin-pwa` + manifest; API solo vía `VITE_API_BASE_URL`.

### Task 12 — Pedidos pendientes
Resumen “Guardar sin pagar” + Historial “Cobrar” + `/cobro/:id`.
Tests: `cobro.deferred.test.ts`.

### Task 13 — Detalle en historial
Botón **Detalles** abre bottom sheet (`GET /pedidos/:id` con `lineas`).
Header + filtros fijos; solo la lista hace scroll.
Tests: `historial.detalle.test.ts`.

### Task 14 — Balance de ventas
Historial → **Balance** → `/balance` con chips Hoy/Semana/Mes.
`GET /pedidos/balance?periodo=…`. Tests: `balance.format.test.ts`.

### Task 15 — Limonada maracuyá + salsas opcionales
Bebida `$3000`; modal/API permiten platos sin salsa.
Tests: `agregarProducto.rules.test.ts`, `pedidos.test.ts`.

### Task 17 — Historial paginado + medio de pago + Bogotá
Lista completa con **Cargar más** (10); badges Efectivo/Transfer.
Fechas en America/Bogotá. Tests: `historial.meta.test.ts`.

### Task 18 — Ajustes CRUD catálogo
Menú **⚙** → `/ajustes`. CRUD de productos (con toggle **Requiere proteína**),
toppings, bases, salsas y proteínas. API `/catalogo/*`.
Tests: `productoForm.rules.test.ts` (+ backend `catalogo-crud.test.ts`).

### Task 19 — Editar / eliminar en historial
Detalles → **Editar** / **Eliminar** (confirmación). Soft-delete.
Editar ítems también en pagados. Tests: `historial.edit.test.ts`.

### Task 20 — Indicaciones + Eliminados/Restaurar
Resumen/Editar: checkbox **Indicaciones especiales** (off) → textarea; se ven en cocina e historial.
Historial: filtro **Eliminados** + **Restaurar**. Tests: `historial.filters.test.ts`, `pedidoStore.test.ts`.

### Task 21 — Exportar balance Excel
Balance: botón **Exportar Excel** al pie; descarga `.xlsx` del periodo (Hoy/Semana/Mes).

### Task 22 — Alertas de error (RF-21)
Alerta visible arriba ante fallos de red/API (crear, cobrar, guardar, etc.). Sin toasts de éxito.
Tests: `mensajeErrorUsuario.test.ts`.

### Task 23 — Auth / usuarios / seguimiento
Login obligatorio; chip sesión + Salir en Menú. Admin: Usuarios + Seguimiento.
Conflicto 409 al editar pedido concurrente. Tests: `seguimiento.format.test.ts`.

### Task 24 — Cocina en vivo
`/cocina` con SSE (ticket corto, no el token de sesión). Botón Listo. Link desde el menú.

### Task 26 — Sesión y prod
Cookie httpOnly (la PWA no guarda el token). `/usuarios`: no se ve la clave; se asigna una nueva y se pueden cerrar sesiones. Dos admins antes de prod. Ver `PROD.md`.
