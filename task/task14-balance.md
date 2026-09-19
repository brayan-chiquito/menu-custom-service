# Plan — Balance de ventas (simple)

## Objetivo
Que el operador vea, en un vistazo, **cuánto vendió** en **Hoy / Semana / Mes**,
sin gráficas ni exportes. Cierre de caja ligero, no contabilidad.

## Alcance (v1)

### Qué incluye
- Periodos: **Hoy | Esta semana | Este mes** (chips, igual que filtros del historial)
- Cifras:
  - **Cobrado** — suma de `total` de pedidos `pagado` en el periodo
  - **Pedidos pagados** — cantidad
  - **Ticket promedio** — cobrado ÷ pedidos pagados (0 si no hay)
  - **Pendiente por cobrar** — suma de `total` de pedidos `pendiente` (alerta suave)
- Estado vacío: “Sin ventas en este periodo”
- Acceso desde Historial (no desde el menú principal, para no contaminar el flujo de venta)

### Qué NO incluye (después, si hace falta)
- Rango de fechas libre, gráficas, ranking de productos, Excel/PDF, comparación YoY

## UX (Pencil) — listo, esperando OK de código

Frames en `pencilux/UX-Menu.pen`:

| Frame | Contenido |
|-------|-----------|
| **04d** | Historial con link **Balance** + ← Menú |
| **06 — Balance** | Header, chips Hoy/Semana/Mes, hero Cobrado, métricas, pendientes |
| **06b — Balance vacío** | Mismo chrome + empty state + CTA Ir al menú |

**No implementar backend/frontend hasta OK explícito del usuario.** → **OK recibido; implementado.**

Semana = **lunes → hoy (UTC)**.

## Plan técnico

### Backend
- `GET /pedidos/balance?periodo=hoy|semana|mes`
- Respuesta ejemplo:
  ```json
  {
    "periodo": "hoy",
    "desde": "2026-09-19",
    "hasta": "2026-09-19",
    "cobrado": 150000,
    "pedidos_pagados": 8,
    "ticket_promedio": 18750,
    "pendiente": 45000,
    "pedidos_pendientes": 2
  }
  ```
- Semana = lunes→hoy (o últimos 7 días — **decidir en impl:** preferencia **lunes a hoy** local).
- Mes = día 1 del mes → hoy.
- Solo agregados SQL (`SUM`/`COUNT`); no devolver lista de pedidos.
- Tests Vitest + Bruno `obtener-balance.bru`.
- Docs curl en `backend/README.md`.

### Frontend
- Ruta `/balance`
- Chips → query `?periodo=`
- Cards grandes: Cobrado (hero), luego métricas secundarias
- Tests de reglas de formato / periodo
- Actualizar `frontend/README.md` + `QA.md`

### Criterio de aceptación
- Desde Historial se abre Balance y se ven cifras coherentes con pedidos del periodo.
- Cambiar chip actualiza números sin salir de la pantalla.
- Pedidos pendientes no inflan “Cobrado”.
- Docker prod **no** se toca hasta OK de deploy (igual que tasks anteriores).
- Tests automatizados pasan.

## Nota despliegue
Implementar en rama feature (continuación de `feat/pedidos-pendientes` o `feat/balance-ventas`) sin `docker compose up --build` hasta tu OK.
