# Plan — Pedidos pendientes (guardar y cobrar después)

## Objetivo
Permitir guardar un pedido sin cobrarlo y, más tarde, marcarlo como
pagado desde el historial (sin rearmar el carrito).

## Flujo UX (maquetas en `pencilux/UX-Menu.pen`)
1. **02b — Resumen (guardar pendiente):** CTA “Ir a cobrar” + “Guardar sin pagar”.
2. **04c — Historial (pendientes + cobrar):** filtro Pendientes + botón “Cobrar ahora”.
3. **05 — Cobro de pedido pendiente:** mismo cobro, contexto `#N · nombre · Pendiente`.

## Plan técnico (cuando des OK)

### Backend (casi listo)
- `POST /pedidos` ya crea `estado: pendiente` sin pago.
- `PATCH /pedidos/:id/pago` + `PATCH /pedidos/:id/confirmar` ya existen.
- Ajustes menores:
  - `GET /pedidos/:id` (detalle) si hace falta para cobro diferido.
  - Tests: guardar pendiente → cobrar después → WhatsApp.
  - Bruno + README curl.

### Frontend
1. Resumen: “Guardar sin pagar” → `POST /pedidos` → clear carrito → Historial/Pendientes.
2. Historial: en tarjetas pendientes, “Cobrar ahora” → `/cobro/:id` (o estado).
3. Cobro: modo `pedidoId` existente → solo pago + confirmar (sin crear de nuevo).
4. Flujo actual “Ir a cobrar” se mantiene igual.
5. Tests + README frontend.

### Docs
- `prompts-ux.md` (ya actualizado), CONTEXT, task si aplica.

## Criterio de aceptación
- Se puede guardar sin pagar y aparece en Pendientes.
- Desde Historial se cobra y pasa a Pagado + WhatsApp.
- El cobro inmediato actual no se rompe.
- Tests automatizados verdes.
