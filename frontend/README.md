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
| `/` | Menú + modal base/salsa/proteína/toppings |
| `/resumen` | Pedido actual |
| `/cobro` | Pago desde carrito + WhatsApp / Copiar pedido |
| `/cobro/:pedidoId` | Cobrar un pedido ya guardado (pendiente) |
| `/historial` | Pedidos del día (+ Cobrar / Detalles / Balance) |
| `/balance` | Cobrado Hoy/Semana/Mes |

## Pedidos pendientes

1. En **Resumen**: “Guardar sin pagar” → `POST /pedidos` → Historial (filtro Pendientes).
2. En **Historial**: “Cobrar ahora” → `/cobro/:id` → solo pago + confirmar.
3. “Ir a cobrar” sigue siendo el flujo inmediato (crear + pagar + confirmar).

## Tareas

### Task 7 — Pencil
Ver `pencilux/UX-Menu.pen` y `prompts-ux.md`.

### Task 8 — Menú
`features/menu` + `shared/api/menuApi.ts` → `GET /menu`.

### Task 9 — Resumen + Cobro
`pedido-actual` + `cobro` → POST/PATCH pago/confirmar + copiar mensaje.

### Task 10 — Historial
`historial` → `GET /pedidos?fecha=hoy`.

### Task 11 — PWA
`vite-plugin-pwa` + manifest; API solo vía `VITE_API_BASE_URL`.

### Task 12 — Pedidos pendientes
Resumen “Guardar sin pagar” + Historial “Cobrar ahora” + `/cobro/:id`.
Tests: `cobro.deferred.test.ts`.

### Task 13 — Detalle en historial
Botón **Detalles** abre bottom sheet (`GET /pedidos/:id` con `lineas`).
Header + filtros fijos; solo la lista hace scroll.
Tests: `historial.detalle.test.ts`.

### Task 14 — Balance de ventas
Historial → **Balance** → `/balance` con chips Hoy/Semana/Mes.
`GET /pedidos/balance?periodo=…`. Tests: `balance.format.test.ts`.
