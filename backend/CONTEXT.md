# Contexto del proyecto — Backend

## Qué es
API para un sistema de pedidos de menú (sin papel/lápiz). Un solo
operador, uso intensivo por 2 días, corre localmente en un PC vía
Docker, accesible por Tailscale (sin dominio, sin exposición pública).

## Stack obligatorio
- Node.js + TypeScript + Express
- SQLite (better-sqlite3 o Prisma con provider sqlite) — un solo
  archivo, sin motor de BD aparte
- whatsapp-web.js para notificaciones (sesión persistida en volumen)

## Reglas de negocio no negociables
1. Un pedido sin nombre de cliente se guarda como `"Sin nombre"`.
2. El vuelto = monto_pagado - total; si monto_pagado < total, la
   confirmación de pago debe rechazarse (400) con el faltante.
3. El precio de cada ítem/adición se congela en el momento de crear
   el pedido (columna `precio_*_momento`) — cambios posteriores en el
   catálogo NO deben afectar pedidos ya creados.
4. Un pedido pasa de `pendiente` a `pagado` solo mediante una acción
   explícita de confirmación, nunca automáticamente.
5. Si el envío de WhatsApp falla, el pedido igual queda `pagado`. El
   fallo se loggea, nunca bloquea ni revierte la confirmación de pago.
6. Cada `pedido_item` debe traer una base (`base_id`) y al menos una
   salsa (`salsa_ids[]`) — son obligatorias, sin costo adicional.
   Se pueden elegir varias salsas por ítem. Los toppings (`adiciones`)
   siguen siendo opcionales y con costo.
7. Si `producto.requiere_proteina` es `true`, el `pedido_item` debe
   incluir `proteina_id` (obligatorio, 400 si falta) eligiendo entre
   Carne o Pollo (ej. Candente, Chicharronero). Si es `false`,
   `proteina_id` debe ir `null` — no ofrecer ni exigir esa selección
   (ej. Apoteósico ya trae Carne y Pollo; Cachaco trae solo Pollo;
   Pacífico no es de proteína a elegir).

## Arquitectura (obligatoria, no flexibilizar)
Capas: `controller → service → repository`. El controller NO contiene
lógica de negocio, solo mapea HTTP ↔ service. El repository NO
contiene reglas de negocio, solo acceso a datos.

Notificaciones detrás de una interfaz:
```ts
interface Notificador {
  enviar(pedido: PedidoDTO): Promise<{ enviada: boolean }>;
}
```
`WhatsAppNotificador` la implementa. `PedidoService` depende de la
interfaz, no de la implementación concreta (inyección por
constructor). `PATCH /pedidos/:id/confirmar` responde con
`notificacion: { enviada, mensaje }` para que el frontend muestre
feedback y ofrezca “Copiar pedido” si `enviada` es false.

## Estructura de carpetas
```
backend/src/
  modules/
    productos/  (controller, service, repository, types)
    pedidos/    (controller, service, repository, types)
    notificaciones/ (notificador.interface.ts, whatsapp.notificador.ts)
  shared/ (db, errors, middlewares)
  seed/
    seed.ts       (script de carga/corrección de datos del menú)
  app.ts
  server.ts
```

## Modelo de datos
```
productos    (id, nombre, descripcion, precio, categoria, disponible, requiere_proteina)
bases        (id, nombre)                    -- Maduro, Verde
salsas       (id, nombre)                     -- Ajo, Agridulce, Ranchera, BBQ
proteinas    (id, nombre)                     -- Carne, Pollo
adiciones    (id, nombre, precio, producto_id NULL=global)  -- toppings
pedidos      (id, nombre_cliente, total, monto_pagado, vuelto, estado, created_at)
pedido_items (id, pedido_id, producto_id, cantidad, precio_unit_momento, base_id, proteina_id NULLABLE)
pedido_item_salsas (id, pedido_item_id, salsa_id)
pedido_item_adiciones (id, pedido_item_id, adicion_id, precio_momento)
```

`requiere_proteina` marca qué productos necesitan elegir entre Carne
o Pollo al armar el ítem (Candente, Chicharronero). Los que ya incluyen
ambas proteínas (Apoteósico) o una fija / ninguna (Cachaco, Pacífico,
etc.) tienen `requiere_proteina = false` y no usan `proteina_id`.
`nombre` es único en `productos`, `bases`, `salsas`, `proteinas` y
`adiciones` — necesario para que el seed haga upsert por nombre sin
duplicar filas cuando se corrija el menú.

## Endpoints
| Método | Ruta | Función |
|---|---|---|
| GET | /menu | Productos (con descripción y requiere_proteina), bases, salsas, proteinas y toppings en una sola llamada |
| POST | /pedidos | Crear pedido |
| PATCH | /pedidos/:id/pago | Registrar monto pagado, devolver vuelto |
| PATCH | /pedidos/:id/confirmar | Confirmar pago, dispara notificación |
| GET | /pedidos?fecha=hoy | Listar pedidos del día |

## Convenciones
- Errores de negocio: lanzar excepciones tipadas, capturadas en un
  middleware central de errores — nunca `try/catch` repetido por
  controller.
- Nombres de archivos y carpetas en español (coherente con el
  dominio del negocio), código (variables, funciones) en inglés o
  español consistente — elegir uno y no mezclar.
- No agregar frameworks de DI ni ORMs pesados: el tamaño del
  proyecto no lo justifica, usar inyección manual por constructor.
