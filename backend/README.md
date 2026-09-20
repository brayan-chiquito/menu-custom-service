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
  -d "{\"monto_pagado\":30000}"
```

**Debería responder** — `200`, `vuelto: 6000`, `estado: "pendiente"`.

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

**Debería responder** — `200` (array; vacío `[]` si no hay pedidos del día):

```json
[
  {
    "id": 1,
    "nombre_cliente": "Ana",
    "total": 24000,
    "monto_pagado": 30000,
    "vuelto": 6000,
    "estado": "pagado",
    "created_at": "2026-09-18 05:50:00"
  }
]
```

Filtra con `date(created_at) = date('now')` (mismo criterio UTC que el
default SQLite `datetime('now')`). No incluye `items` (historial).

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
  "pedidos_pagados": 8,
  "ticket_promedio": 18750,
  "pendiente": 45000,
  "pedidos_pendientes": 2
}
```

- **hoy**: solo el día actual (UTC, mismo criterio que historial).
- **semana**: lunes → hoy (UTC).
- **mes**: día 1 del mes → hoy.
- `cobrado` / `pedidos_pagados` / `ticket_promedio` solo cuentan `pagado`.
- `pendiente` no infla cobrado.

Bruno: `obtener-balance.bru`. Tests: `tests/balance.test.ts`.

### GET /pedidos/:id

```bash
curl "http://localhost:3000/pedidos/1"
```

**Debería responder** — `200` con el pedido y `lineas` legibles:

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
      "producto_nombre": "Quesudo",
      "base_nombre": "Verde",
      "salsa_nombres": ["Ajo"],
      "proteina_nombre": null,
      "adiciones": [],
      "precio_unit_momento": 10000,
      "subtotal": 10000
    }
  ]
}
```

Sirve para cobrar después y para **Detalles** en el historial.

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

### Historial — GET /pedidos?fecha=hoy

- Lista pedidos del día (resumen sin items).
- Tests: `tests/historial.test.ts`.
- Bruno: `bruno/03-pedidos/listar-pedidos-hoy.bru`.

### Detalle / cobro diferido / balance

- `GET /pedidos/:id`, cobro diferido y `GET /pedidos/balance` — ver secciones curl arriba.
- Migración v3→v4: `base_id` nullable **sin** borrar pedidos (`tests/migrate-v4.test.ts`).

