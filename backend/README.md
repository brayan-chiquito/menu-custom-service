# Backend — menu-custom-service

API Express + TypeScript + SQLite para pedidos de menú (Platanópolis).

## Arranque local

```bash
cd backend
npm install
npm run seed    # menú real (upsert por nombre)
npm run dev     # http://localhost:3000
```

Variables útiles:

- `PORT` (default `3000`)
- `DATABASE_PATH` (default `data/menu.db`)
- `WHATSAPP_TARGET_NUMBER` — número que **recibe** el aviso (código país + número, ej. `573116508052`). Si está definido, usa `WhatsappNotificador`; si no, `FakeNotificador`
- `WWEBJS_AUTH_PATH` — carpeta de sesión WhatsApp (default `.wwebjs_auth`)

El número que **envía** no es variable de entorno: es el WhatsApp que escanea el QR al arrancar el backend (una vez; la sesión queda en disco). Para cambiar solo el receptor, edita `WHATSAPP_TARGET_NUMBER` en el `.env` de la raíz del monorepo y reinicia.

## Tests automatizados

```bash
npm test
```

## Bruno

1. Abre la colección `backend/bruno/`.
2. Environment **local** (`baseUrl = http://localhost:3000`).
3. O pega los `curl` de abajo (Bruno importa curl).

Flujo: `GET /menu` → anotar IDs → `POST /pedidos` → `PATCH .../pago` → `PATCH .../confirmar` → `GET /pedidos?fecha=hoy`.

---



## Consultas curl (copiar → pegar → Bruno)



### GET /health

```bash
curl http://localhost:3000/health
```

**Debería responder** — `200`:

```json
{
  "status": "ok",
  "service": "menu-custom-backend",
  "timestamp": "2026-09-18T06:00:00.000Z"
}
```



### GET /menu

```bash
curl http://localhost:3000/menu
```

**Debería responder** — `200` (estructura):

```json
{
  "productos": [
    {
      "id": 2,
      "nombre": "Candente",
      "descripcion": "Carne o Pollo Desmechado + ...",
      "precio": 22000,
      "categoria": "platos",
      "disponible": true,
      "requiere_proteina": true,
      "adiciones": [{ "id": 4, "nombre": "Guacamole", "precio": 2000, "producto_id": null }]
    },
    {
      "id": 4,
      "nombre": "Apoteósico",
      "descripcion": "Carne y Pollo Desmechado + ...",
      "precio": 20000,
      "requiere_proteina": false,
      "adiciones": []
    }
  ],
  "bases": [{ "id": 1, "nombre": "Maduro" }, { "id": 2, "nombre": "Verde" }],
  "salsas": [
    { "id": 1, "nombre": "Ajo" },
    { "id": 2, "nombre": "Agridulce" },
    { "id": 3, "nombre": "Ranchera" },
    { "id": 4, "nombre": "BBQ" }
  ],
  "proteinas": [
    { "id": 1, "nombre": "Carne" },
    { "id": 2, "nombre": "Pollo" }
  ]
}
```

Candente/Chicharronero → elegir Carne **o** Pollo. Apoteósico ya trae ambas → sin selector.
Limonada de maracuyá (`categoria: bebidas`, `$3000`) → sin base/salsa/proteína.

### POST /pedidos (con proteína)

```bash
curl -X POST http://localhost:3000/pedidos \
  -H "Content-Type: application/json" \
  -d "{\"nombre_cliente\":\"Ana\",\"items\":[{\"producto_id\":2,\"cantidad\":1,\"base_id\":1,\"salsa_ids\":[4],\"proteina_id\":1,\"adiciones\":[4]}]}"
```

**Debería responder** — `201` (total `24000` = 22000+2000):

```json
{
  "id": 1,
  "nombre_cliente": "Ana",
  "indicaciones": null,
  "total": 24000,
  "monto_pagado": null,
  "vuelto": null,
  "estado": "pendiente",
  "items": [
    {
      "producto_id": 2,
      "cantidad": 1,
      "precio_unit_momento": 22000,
      "base_id": 1,
      "salsa_ids": [4],
      "proteina_id": 1,
      "adiciones": [{ "adicion_id": 4, "precio_momento": 2000 }]
    }
  ]
}
```

### POST /pedidos (con indicaciones)

```bash
curl -X POST http://localhost:3000/pedidos \
  -H "Content-Type: application/json" \
  -d "{\"nombre_cliente\":\"Mauricio\",\"indicaciones\":\"Sin chicharrón · +maíz\",\"items\":[{\"producto_id\":1,\"cantidad\":1,\"base_id\":1,\"salsa_ids\":[1],\"adiciones\":[]}]}"
```

**Debería responder** — `201` con `indicaciones: "Sin chicharrón · +maíz"`. Vacío/null → no se guarda ni sale en WhatsApp.

### POST /pedidos (sin proteína — Apoteósico)

```bash
curl -X POST http://localhost:3000/pedidos \
  -H "Content-Type: application/json" \
  -d "{\"nombre_cliente\":\"\",\"items\":[{\"producto_id\":4,\"cantidad\":1,\"base_id\":1,\"salsa_ids\":[1,4],\"proteina_id\":null,\"adiciones\":[]}]}"
```

**Debería responder** — `201` con `nombre_cliente: "Sin nombre"` y `proteina_id: null`.

### PATCH /pedidos/:id/pago

```bash
curl -X PATCH http://localhost:3000/pedidos/1/pago \
  -H "Content-Type: application/json" \
  -d "{\"monto_pagado\":30000,\"es_transferencia\":false}"
```

**Debería responder** — `200`, `vuelto: 6000`, `estado: "pendiente"`, `es_transferencia: false`.

Con transferencia:

```bash
curl -X PATCH http://localhost:3000/pedidos/1/pago \
  -H "Content-Type: application/json" \
  -d "{\"monto_pagado\":24000,\"es_transferencia\":true}"
```

**Debería responder** — `200` con `es_transferencia: true`.

### PATCH /pedidos/:id/pago (insuficiente)

```bash
curl -X PATCH http://localhost:3000/pedidos/1/pago \
  -H "Content-Type: application/json" \
  -d "{\"monto_pagado\":10000}"
```

**Debería responder** — `400`:

```json
{ "error": "Monto insuficiente", "faltante": 14000 }
```



### PATCH /pedidos/:id/confirmar

```bash
curl -X PATCH http://localhost:3000/pedidos/1/confirmar
```

**Debería responder** — `200`:

```json
{
  "id": 1,
  "nombre_cliente": "Ana",
  "total": 24000,
  "monto_pagado": 30000,
  "vuelto": 6000,
  "estado": "pagado",
  "created_at": "2026-09-18 05:50:00",
  "items": [],
  "notificacion": {
    "enviada": true,
    "mensaje": "Pedido #1\nCliente: Ana\nDetalle:\n- 1x Candente (base: Maduro, salsa: BBQ, proteína: Carne, extras: Guacamole)\nTotal: $24000"
  }
}
```

Si WhatsApp falla: mismo pedido `pagado` con `"enviada": false` y el
mismo `mensaje` listo para “Copiar pedido” en el frontend.

### GET /pedidos?fecha=hoy

```bash
curl "http://localhost:3000/pedidos?fecha=hoy"
```

**Debería responder** — `200` (array; vacío `[]` si no hay pedidos del día Bogotá):

```json
[
  {
    "id": 1,
    "nombre_cliente": "Ana",
    "total": 24000,
    "monto_pagado": 30000,
    "vuelto": 6000,
    "estado": "pagado",
    "es_transferencia": false,
    "created_at": "2026-09-18 05:50:00"
  }
]
```

Filtra con calendario **America/Bogotá** (`date(created_at, '-5 hours')`).
No incluye `items` (historial).

### GET /pedidos?limit=10&offset=0&estado=

```bash
curl "http://localhost:3000/pedidos?limit=10&offset=0"
curl "http://localhost:3000/pedidos?limit=10&offset=10&estado=pagado"
```

**Debería responder** — `200`:

```json
{
  "items": [],
  "total": 12,
  "limit": 10,
  "offset": 0,
  "has_more": true
}
```

- Sin `fecha`: todos los pedidos, más recientes primero.
- `estado` opcional: `pendiente` | `pagado`.
- Default `limit=10` (máx. 50), `offset=0`.

Bruno: `listar-pedidos-hoy.bru`, `listar-pedidos-paginado.bru`.
Tests: `tests/historial.test.ts`, `tests/time-bogota.test.ts`.

### GET /pedidos/balance?periodo=hoy|semana|mes

```bash
curl "http://localhost:3000/pedidos/balance?periodo=hoy"
```

**Debería responder** — `200`:

```json
{
  "periodo": "hoy",
  "desde": "2026-09-19",
  "hasta": "2026-09-19",
  "cobrado": 150000,
  "cobrado_efectivo": 90000,
  "cobrado_transferencia": 60000,
  "pedidos_pagados": 8,
  "pedidos_efectivo": 5,
  "pedidos_transferencia": 3,
  "ticket_promedio": 18750,
  "pendiente": 45000,
  "pedidos_pendientes": 2,
  "gastos": 12000,
  "ganancia": 138000
}
```

- **hoy** / **semana** / **mes**: calendario **America/Bogotá**.
- `cobrado` / `pedidos_pagados` / `ticket_promedio` solo cuentan `pagado`.
- `cobrado_efectivo` / `cobrado_transferencia` según `es_transferencia` al pagar.
- `gastos` = suma de totales de egresos del periodo; `ganancia` = cobrado − gastos.
- `pendiente` no infla cobrado.

Bruno: `obtener-balance.bru`. Tests: `tests/balance.test.ts`, `tests/egresos-balance.test.ts`.

### GET /pedidos/balance/export?periodo=hoy|semana|mes

```bash
curl -OJ "http://localhost:3000/pedidos/balance/export?periodo=semana"
```

**Debería responder** `200` con archivo `.xlsx`
(`Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`).

- Hojas: **Resumen**, **Historial** (pedidos del periodo), **Egresos** (AutoFilter).
- Nombre según periodo:
  - hoy → `balance-platanopolis-hoy-YYYY-MM-DD.xlsx`
  - semana → `balance-platanopolis-semana-YYYY-MM-DD_al_YYYY-MM-DD.xlsx`
  - mes → `balance-platanopolis-mes-YYYY-MM.xlsx`
- Mismo rango Bogotá que el balance JSON; sin pedidos soft-deleted.

Bruno: `obtener-balance-export.bru`. Tests: `tests/balance-export.test.ts`.

### POST /egresos

```bash
curl -X POST http://localhost:3000/egresos \
  -H "Content-Type: application/json" \
  -d "{\"nombre\":\"Platano\",\"precio\":2000,\"cantidad\":3}"
```

**Debería responder** — `201`:

```json
{
  "id": 1,
  "nombre": "Platano",
  "precio": 2000,
  "cantidad": 3,
  "total": 6000,
  "created_at": "2026-09-19 12:00:00"
}
```

### GET /egresos?periodo=hoy|semana|mes

```bash
curl "http://localhost:3000/egresos?periodo=hoy"
```

**Debería responder** — `200` (array de egresos del periodo).

Bruno: `04-egresos/`. Tests: `tests/egresos-balance.test.ts`.

### GET/POST/PATCH/DELETE /catalogo/productos

```bash
curl http://localhost:3000/catalogo/productos
```

```bash
curl -X POST http://localhost:3000/catalogo/productos \
  -H "Content-Type: application/json" \
  -d "{\"nombre\":\"Especial QA\",\"descripcion\":\"test\",\"precio\":15000,\"categoria\":\"platos\",\"disponible\":true,\"requiere_proteina\":true}"
```

**Debería responder** `201`:

```json
{
  "id": 10,
  "nombre": "Especial QA",
  "descripcion": "test",
  "precio": 15000,
  "categoria": "platos",
  "disponible": true,
  "requiere_proteina": true
}
```

```bash
curl -X PATCH http://localhost:3000/catalogo/productos/10 \
  -H "Content-Type: application/json" \
  -d "{\"requiere_proteina\":false}"
```

**Debería responder** `200` con el producto actualizado.

```bash
curl -X DELETE http://localhost:3000/catalogo/productos/10
```

**Debería responder** `204` (sin cuerpo). Si hay referencias: `409`/`400` con mensaje claro.

### POST /catalogo/adiciones · bases · salsas · proteinas

```bash
curl -X POST http://localhost:3000/catalogo/adiciones \
  -H "Content-Type: application/json" \
  -d "{\"nombre\":\"Extra queso\",\"precio\":2500}"
```

```bash
curl -X POST http://localhost:3000/catalogo/bases \
  -H "Content-Type: application/json" \
  -d "{\"nombre\":\"Base QA\"}"
```

```bash
curl -X POST http://localhost:3000/catalogo/proteinas \
  -H "Content-Type: application/json" \
  -d "{\"nombre\":\"Cerdo\"}"
```

**Debería responder** `201` con `{ id, nombre, ... }`. Mismo patrón `GET/PATCH/DELETE` en `/catalogo/salsas` y `/catalogo/proteinas`.

Bruno: `05-catalogo/`. Tests: `tests/catalogo-crud.test.ts`.

### GET /pedidos/:id

```bash
curl http://localhost:3000/pedidos/1
```

**Debería responder** `200` con `lineas` (incluye ids de producto/base/salsas/proteína/adiciones).

### PATCH /pedidos/:id

```bash
curl -X PATCH http://localhost:3000/pedidos/1 \
  -H "Content-Type: application/json" \
  -d "{\"nombre_cliente\":\"Ana\",\"indicaciones\":\"Sin cebolla\",\"items\":[{\"producto_id\":1,\"cantidad\":1,\"base_id\":1,\"salsa_ids\":[1],\"adiciones\":[]}]}"
```

**Debería responder** `200` con el pedido actualizado (nombre, indicaciones y/o ítems). En pagado ajusta monto/vuelto.

### DELETE /pedidos/:id

```bash
curl -X DELETE http://localhost:3000/pedidos/1
```

**Debería responder** `204`. Soft-delete (`eliminado_at`); deja de salir en historial/balance.

### GET /pedidos?eliminados=1

```bash
curl "http://localhost:3000/pedidos?limit=10&offset=0&eliminados=1"
```

**Debería responder** `200` con solo pedidos soft-deleted:

```json
{
  "items": [{ "id": 1, "nombre_cliente": "Ana", "eliminado_at": "2026-09-20 18:00:00", "estado": "pendiente" }],
  "total": 1,
  "limit": 10,
  "offset": 0,
  "has_more": false
}
```

### PATCH /pedidos/:id/restaurar

```bash
curl -X PATCH http://localhost:3000/pedidos/1/restaurar
```

**Debería responder** `200` con el pedido restaurado (`eliminado_at: null`). Vuelve al historial/balance.

Bruno: `crear-pedido-indicaciones.bru`, `listar-pedidos-eliminados.bru`, `restaurar-pedido.bru`.
Tests: `tests/indicaciones-restaurar.test.ts`.

Bruno (Task 19): `actualizar-pedido.bru`, `eliminar-pedido.bru`. Tests: `tests/pedidos-editar-eliminar.test.ts`.

### GET /pedidos/:id (detalle)

```bash
curl "http://localhost:3000/pedidos/1"
```

**Debería responder** — `200` con el pedido y `lineas` legibles (incluye ids para edición):

```json
{
  "id": 1,
  "nombre_cliente": "Ana",
  "total": 10000,
  "monto_pagado": null,
  "vuelto": null,
  "estado": "pendiente",
  "created_at": "2026-09-18 05:50:00",
  "lineas": [
    {
      "cantidad": 1,
      "producto_id": 1,
      "producto_nombre": "Quesudo",
      "base_id": 1,
      "base_nombre": "Verde",
      "salsa_ids": [1],
      "salsa_nombres": ["Ajo"],
      "proteina_id": null,
      "proteina_nombre": null,
      "adiciones": [],
      "precio_unit_momento": 10000,
      "subtotal": 10000
    }
  ]
}
```

Sirve para cobrar después, **Detalles** y **Editar** en el historial.

### Cobro diferido (guardar → pagar luego)

1. `POST /pedidos` → queda `pendiente` (sin `monto_pagado`).
2. Más tarde: `PATCH /pedidos/:id/pago` + `PATCH /pedidos/:id/confirmar`.

Bruno: `obtener-pedido.bru` + flujo de pago/confirmar existente.
Tests: `tests/pedidos-pago.test.ts` (GET por id + pay later).

### Task 6.1 — Resultado de notificación en confirmar

- Respuesta incluye `notificacion: { enviada, mensaje }`.
- Tests: `tests/pedidos-pago.test.ts`.

---



## Tareas documentadas



### Task 2 — GET /menu

- Tablas productos (+ descripcion, requiere_proteina), bases, salsas, proteinas, adiciones.
- Nombres únicos. Tests: `tests/menu.test.ts`.



### Task 3 — Seed Platanópolis

- `npm run seed` → `src/seed/seed.ts` upsert por nombre (incluye bebidas
  como Limonada de maracuyá; rename legacy coco → maracuyá).
- Tests: `tests/seed.test.ts`, `tests/menu.test.ts`.



### Task 4 — POST /pedidos

- Platos: `base_id` obligatorio; `salsa_ids` opcional (0 o más); `proteina_id` condicional.
- Bebidas (`categoria=bebidas`): sin base ni salsas.
- Tests: `tests/pedidos.test.ts`.



### Task 5 — Pago / confirmar

- Misma lógica de vuelto + Fake/WhatsApp notificador.
- Tests: `tests/pedidos-pago.test.ts`.



### Task 6 — WhatsApp

- `WhatsappNotificador` con sesión en `.wwebjs_auth` / volumen Docker.
- Mensaje con cliente, productos, base/salsa/proteína/adiciones si aplican, y total.
- Fallos solo se loggean.

### Historial — GET /pedidos (paginado) + fecha=hoy

- `GET /pedidos?limit=&offset=&estado=` — ver curl arriba.
- `GET /pedidos?fecha=hoy` — día Bogotá (compat).
- Zona horaria: America/Bogotá en balance, egresos e historial.
- Tests: `tests/historial.test.ts`, `tests/time-bogota.test.ts`.

### Task 17 — Historial paginado + medio de pago + Bogotá

- Bruno: `listar-pedidos-paginado.bru`.
- Frontend: título Historial, Cargar más, badges Efectivo/Transfer.

### Detalle / cobro diferido / balance / egresos

- `GET /pedidos/:id`, cobro diferido, `GET /pedidos/balance` y egresos — ver secciones curl arriba.
- Migración v3→v4: `base_id` nullable **sin** borrar pedidos (`tests/migrate-v4.test.ts`).
- Migración v4→v5: tabla `egresos` + columna `es_transferencia` (`tests/egresos-balance.test.ts`).

### Task 16 — Egresos + transferencia + ganancia

- `POST/GET /egresos`, pago con `es_transferencia`, balance con desglose y ganancia.
- Bruno: `04-egresos/`, `registrar-pago.bru`, `obtener-balance.bru`.
- Tests: `tests/egresos-balance.test.ts`.

### Task 18 — CRUD catálogo (RF-16)

- `GET/POST/PATCH/DELETE /catalogo/productos|adiciones|bases|salsas|proteinas`.
- Productos: `requiere_proteina` por ítem (bebidas → siempre `false`).
- Bruno: `05-catalogo/`. Tests: `tests/catalogo-crud.test.ts`.

### Task 19 — Editar / eliminar pedidos (RF-17)

- `PATCH /pedidos/:id` (nombre + ítems; pendiente y pagado).
- `DELETE /pedidos/:id` soft-delete (`eliminado_at`); fuera de listado/balance.
- Bruno: `actualizar-pedido.bru`, `eliminar-pedido.bru`.
- Tests: `tests/pedidos-editar-eliminar.test.ts`.

### Task 20 — Indicaciones + restaurar eliminados (RF-18/19)

- `indicaciones` opcional en `POST/PATCH /pedidos`; línea en WhatsApp si hay texto.
- `GET /pedidos?eliminados=1` + `PATCH /pedidos/:id/restaurar`.
- Bruno: `crear-pedido-indicaciones.bru`, `listar-pedidos-eliminados.bru`, `restaurar-pedido.bru`.
- Tests: `tests/indicaciones-restaurar.test.ts`.

### Task 21 — Exportar balance Excel (RF-20)

- `GET /pedidos/balance/export?periodo=hoy|semana|mes` → `.xlsx` (exceljs).
- Hojas Resumen / Historial / Egresos con AutoFilter; nombre con fechas del periodo.
- Bruno: `obtener-balance-export.bru`. Tests: `tests/balance-export.test.ts`.

