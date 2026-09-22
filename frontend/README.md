# Frontend — menu-custom-service

PWA React + Vite + TypeScript para tomar pedidos (mobile-first).

## Arranque

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

`VITE_API_BASE_URL` apunta al backend (ej. `http://localhost:3000` o IP Tailscale).

## Tests

```bash
npm test
```

## Rutas

| Ruta | Feature |
|------|---------|
| `/` | Menú + modal (platos: base obligatoria, salsas opcionales; bebidas: agregar directo) |
| `/resumen` | Pedido actual (+ Guardar sin pagar) |
| `/cobro` | Pago desde carrito (+ checkbox Transferencia) + WhatsApp / Copiar pedido |
| `/cobro/:pedidoId` | Cobrar un pedido ya guardado (pendiente) |
| `/historial` | Todos los días (+ Cargar más, badges, Detalles, Eliminados/Restaurar, Balance) |
| `/historial/:id/editar` | Editar nombre, ítems e indicaciones (pendiente o pagado) |
| `/balance` | Ventas, efectivo/transfer, gastos, ganancia (Hoy/Semana/Mes) |
| `/egresos` | Registrar gasto (nombre, precio, cantidad) + lista del periodo |
| `/ajustes` | Hub catálogo: Productos, Toppings, Bases, Salsas, Proteínas |
| `/ajustes/productos` | CRUD productos (`requiere_proteina` opcional por plato) |
| `/ajustes/toppings` | CRUD toppings (nombre, precio) |
| `/ajustes/bases` · `/salsas` · `/proteinas` | CRUD por nombre |

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
`pedido-actual` + `cobro` → POST/PATCH pago/confirmar + copiar mensaje.

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
Resumen/Editar: checkbox **Indicaciones especiales** (off) → textarea; van al WhatsApp.
Historial: filtro **Eliminados** + **Restaurar**. Tests: `historial.filters.test.ts`, `pedidoStore.test.ts`.

### Task 21 — Exportar balance Excel
Balance: botón **Exportar Excel** al pie; descarga `.xlsx` del periodo (Hoy/Semana/Mes).

### Task 22 — Alertas de error (RF-21)
Alerta visible arriba ante fallos de red/API (crear, cobrar, guardar, etc.). Sin toasts de éxito.
Tests: `mensajeErrorUsuario.test.ts`.
