# Contexto del proyecto — Frontend

## Qué es
Interfaz móvil (PWA) para tomar pedidos de un menú sin papel/lápiz.
Un solo operador, se usa con una sola mano mientras se atiende gente.
Consume la API del backend vía la IP de Tailscale del PC (no hay
dominio ni HTTPS público).

## Stack obligatorio
- React + Vite + TypeScript
- PWA (manifest + service worker mínimo, instalable en pantalla de
  inicio)
- Estado local con Context API o Zustand (nada de Redux, no se
  justifica para este tamaño)

## Pantallas (ver prompts-ux.md para el detalle visual de cada una)
1. Armar pedido (menú + carrito en construcción)
2. Resumen del pedido (editar cantidades, nombre opcional, ir a cobrar
   **o guardar sin pagar**)
3. Cobro (monto recibido → vuelto → confirmar); también cobra un
   pendiente existente desde Historial (`/cobro/:id`)
4. Historial del día (filtro + **Cobrar ahora** en pendientes)

## Reglas de negocio a reflejar en UI
- Nombre de cliente vacío → se envía como vacío/null, el backend lo
  guarda como "Sin nombre" (no duplicar esa lógica en el frontend).
- Al agregar un producto al pedido, es **obligatorio** elegir una base
  (Maduro/Verde) y **al menos una** salsa (Ajo/Agridulce/Ranchera/BBQ;
  se pueden marcar varias) antes de poder confirmarlo — sin costo
  adicional. Los toppings siguen siendo opcionales y con costo.
- Si el producto trae `requiere_proteina: true` (ej. Candente,
  Chicharronero), mostrar también un selector obligatorio Carne/Pollo
  antes de poder agregarlo. Si `requiere_proteina` es `false`, NO
  mostrar ese selector (el plato ya trae proteína fija, ambas, o
  ninguna — ej. Apoteósico “Carne y Pollo”, Cachaco solo Pollo).
- El botón "Confirmar pago" solo se habilita si monto_recibido >=
  total (validar en cliente, pero el backend también valida — no
  confiar solo en el frontend).
- Se puede **guardar sin pagar** desde Resumen (`POST /pedidos` →
  `pendiente`). Luego, desde Historial, **Cobrar ahora** abre el cobro
  de ese `pedido_id` sin rearmar el carrito.
- Tras confirmar el pago, mostrar feedback de si el WhatsApp se envió
  o no, pero SIN bloquear ni revertir la pantalla — el pedido ya
  quedó pagado independientemente de ese resultado.
- Si el WhatsApp **falla** (`notificacion.enviada === false` en la
  respuesta de confirmar), mostrar un botón **"Copiar pedido"** que
  copie al portapapeles `notificacion.mensaje` para pegarlo en
  WhatsApp manualmente.

## Arquitectura (obligatoria)
Por feature, no por tipo de archivo. Cada feature expone:
- un hook `useX` con toda la lógica (llamadas a API, cálculos,
  estado)
- un componente que solo renderiza (recibe datos del hook, no
  calcula ni llama a la API directamente)

```
frontend/src/
  features/
    menu/            (MenuList.tsx, useMenu.ts)
    pedido-actual/   (PedidoActual.tsx, usePedidoActual.ts)
    cobro/           (Cobro.tsx, useCobro.ts)
    historial/       (HistorialPedidos.tsx, useHistorial.ts)
  shared/
    api/             (pedidosApi.ts, menuApi.ts — única capa
                       que hace fetch, nadie más llama fetch directo)
    components/      (Button, Modal, Input — sin lógica de dominio,
                       no importan tipos de "pedido" ni "producto")
  App.tsx
```

## Convenciones de estilo UI
- Mobile-first, botones táctiles ≥48px de alto.
- Un solo foco visual por pantalla, especialmente en Cobro (maneja
  dinero — prioridad total a la claridad sobre la estética).
- Estados vacíos y de error siempre contemplados (ver prompts-ux.md).

## Variables de entorno
- `VITE_API_BASE_URL`: IP de Tailscale del PC + puerto del backend.
  Debe ser configurable sin tocar código (archivo `.env`), porque la
  IP puede variar si se reinstala Tailscale.
