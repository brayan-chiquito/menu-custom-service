# Plan — Detalle de pedido en Historial

## Objetivo
En Historial, cada registro tiene un botón **Detalles** que abre un
bottom sheet / modal con el contenido completo del pedido: ítems, base,
salsas, proteína, toppings, subtotales y, si aplica, monto/vuelto.

Header **Hoy** / ← Menú y los filtros quedan fijos; solo la lista hace
scroll (no se pierde la navegación al revisar muchos pedidos).

## Diseño UX
- Tarjetas compactas con CTA **Detalles** (y **Cobrar** si pendiente).
- Detalle en **modal / bottom sheet** (no expandir la tarjeta).
- Cerrar con ✕ o toque fuera; filtros y ← Menú siempre visibles.

## Implementado (`feat/pedidos-pendientes`)

### Backend
- `GET /pedidos/:id` con `lineas` (nombres legibles).
- Tests + Bruno `obtener-pedido.bru`.

### Frontend
1. Botón **Detalles** → abre sheet; `GET /pedidos/:id` (cache por id).
2. Lista de ítems + extras; si `pagado`, monto y vuelto.
3. Pendientes: **Cobrar** en tarjeta y en el sheet → `/cobro/:id`.
4. Layout sticky: `.historial-top` fijo + `.historial-scroll`.
5. Tests: `historial.detalle.test.ts` (formato de líneas).
6. README frontend + `prompts-ux.md` + `QA.md`.

### Criterio de aceptación
- Desde Historial se ve qué se pidió (pagado o pendiente) en sheet.
- Filtros y ← Menú no se pierden al hacer scroll.
- Docker de producción local no se toca hasta OK de deploy.

## Nota despliegue
Sin `docker compose up --build` hasta tu OK.
