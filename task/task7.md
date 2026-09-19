Antes de este paso: maqueta en Pencil las 4 pantallas usando cada
prompt de prompts-ux.md (Armar pedido, Resumen, Cobro, Historial).
Este diseño es el que vas a usar como referencia visual
en los siguientes prompts — no se escribe código de frontend hasta
tener estas 4 pantallas maquetadas.

En "Armar pedido", el modal/bottom sheet de agregar ítem debe
contemplar:
- selector obligatorio de base (Maduro/Verde)
- selector obligatorio de salsa (Ajo/Agridulce/Ranchera/BBQ)
- selector obligatorio Carne/Pollo solo si el producto tiene
  `requiere_proteina: true` (oculto si es false; ej. Apoteósico ya
  trae ambas y no muestra ese control)
- toppings opcionales con precio
