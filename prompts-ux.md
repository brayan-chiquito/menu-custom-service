# Prompts UX — Platanópolis (operador móvil)

Guion visual para Pencil y luego para implementación. Una sola mano,
botones ≥48px, un foco claro por pantalla.

Marca: **Platanópolis**. Paleta: verde plantain `#2F6B3A`, fondo `#F7F8F5`,
texto `#1C2A1F`, superficie blanca, acento de dinero en Cobro `#0F3D24`.

Pantallas Pencil: `01`…`05` pedido/cobro/historial · **`06` Balance** (v1 simple).

---

## Pantalla: Armar pedido

**Objetivo:** elegir productos del menú y armar el carrito.

**Contenido:**
- Header con marca “Platanópolis” + acceso a Historial
- Grid de productos (nombre, descripción corta, precio, botón “+” ≥48px)
- Barra inferior fija: resumen “N ítems · $total” + CTA “Ver pedido”
- Estado vacío del carrito: barra dice “Sin ítems aún”

**Modal / bottom sheet al tocar “+”:**
- Título = nombre del producto + precio base
- **Base** (obligatorio): Maduro | Verde — chips ≥48px
- **Salsas** (obligatorio, una o más): Ajo | Agridulce | Ranchera | BBQ
- **Proteína** (solo si `requiere_proteina`): Carne | Pollo — si el
  producto no la requiere (ej. Apoteósico), **no mostrar** esta sección
- **Toppings** (opcional): lista con precio; multi-selección
- CTA “Agregar” deshabilitado hasta base (+ proteína si aplica); salsas opcionales
- Cancelar / cerrar

---

## Pantalla: Resumen del pedido

**Objetivo:** revisar ítems, cantidades y nombre antes de cobrar **o**
guardar el pedido sin pagar.

**Contenido:**
- Lista de ítems: producto, base, salsas, proteína (si hay), toppings,
  precio línea, controles − / cantidad / + (≥48px)
- Campo “Nombre del cliente (opcional)” — placeholder “Sin nombre”
- Total destacado
- CTA primario “Ir a cobrar” (flujo actual)
- CTA secundario **“Guardar sin pagar”** (≥48px): crea el pedido en
  backend con estado `pendiente`, limpia el carrito y lleva a
  Historial filtrado en Pendientes (o muestra feedback breve)
- Estado vacío: “Aún no hay productos. Volver al menú”

---

## Pantalla: Cobro

**Objetivo:** recibir dinero y confirmar pago. Máxima claridad.
Sirve tanto para cobro inmediato (desde Resumen) como para cobrar un
pedido ya guardado (desde Historial).

**Contenido (un solo foco):**
- Si viene de un pendiente: línea de contexto “Pedido #N · Nombre · Pendiente”
  y back “← Historial”
- Total a cobrar en tipografía grande
- Input “Monto recibido” (teclado numérico mental / campo grande)
- Vuelto en tiempo real (grande): `monto − total` o “Faltan $X”
  (título “Vuelto” encima del monto)
- Botón “Confirmar pago” ≥48px, **deshabilitado** si monto < total
- Tras confirmar: toast/banner “Pedido pagado” + línea secundaria
  “WhatsApp enviado” / “WhatsApp no enviado” sin bloquear ni revertir
- Si WhatsApp falla: botón **“Copiar pedido”** (≥48px) que copia el
  texto del pedido al portapapeles para enviarlo a mano
- CTA secundario “Nuevo pedido”

---

## Pantalla: Historial del día

**Objetivo:** ver pedidos de hoy, filtrar por estado, **ver detalle**
de cada pedido y **cobrar** los pendientes.

**Contenido:**
- Header + filtros **fijos** (siempre visibles); solo la lista hace scroll
- Lista: nombre, hora (#id), total, badge estado (tarjetas compactas)
- CTA **“Detalles”** (≥48px): abre **bottom sheet / modal** con el
  detalle (no expande la tarjeta ni alarga la página)
  - Ítems: cantidad × producto, base, salsas, proteína, toppings, subtotal
  - Si pagado: monto recibido y vuelto
  - Cerrar con ✕ o toque fuera
- Si `estado === pendiente`: CTA **“Cobrar”** en la tarjeta (y también
  en el sheet) → `/cobro/:id`
- Estado vacío: “No hay pedidos hoy”
- Volver al menú (siempre visible arriba)
- Acceso a **Balance** (texto/botón en header o bajo filtros)

---

## Pantalla: Balance de ventas

**Objetivo:** cierre de caja simple — ver cobrado y pendientes por
periodo, sin gráficas ni listas largas.

**Entrada:** desde Historial → “Balance”.
**Salida:** ← Historial (o Menú).

**Contenido (frame Pencil `06 — Balance`):**
- Header: título **Balance** + link **← Historial** (mismo patrón que Hoy)
- Chips periodo (≥48px): **Hoy** | **Semana** | **Mes** (uno activo)
- Card hero (grande): etiqueta “Cobrado” + monto `$X` tipografía fuerte
  (acento dinero `#0F3D24` / verde marca)
- Fila de 2 métricas compactas:
  - Pedidos pagados: `N`
  - Ticket promedio: `$X`
- Bloque secundario (fondo chip suave): “Pendiente por cobrar: `$X` · N pedidos”
  — solo si `pendiente > 0`; si no, ocultar o mostrar “Sin pendientes”
- Rango en texto muted bajo los chips: ej. “19 sep” / “15–19 sep” / “sep 2026”
- Estado vacío (`06b`): “Sin ventas en este periodo” + CTA “Ir al menú”

**No incluir en v1:** gráficas, selector de fechas, lista de pedidos,
exportar, ranking de productos.

**Mobile:** 390×844, un solo scroll si hace falta; priorizar hero Cobrado
arriba del fold.
