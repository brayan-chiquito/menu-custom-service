Implementa el módulo pedidos siguiendo backend/CONTEXT.md: tablas
pedidos, pedido_items, pedido_item_salsas y pedido_item_adiciones.
Endpoint POST /pedidos que reciba items (producto_id, cantidad,
base_id, salsa_ids[], proteina_id opcional/null, adiciones[]) y
nombre_cliente opcional. base_id y salsa_ids (al menos una) son
obligatorios por cada item (400 si faltan). Si el producto tiene
requiere_proteina=true, proteina_id es obligatorio (400 si falta); si
requiere_proteina=false, proteina_id debe ser null (400 si viene
informado). El service debe: calcular el total sumando
precio_unit_momento de cada item + precio_momento de sus adiciones
(congelando los precios actuales del catálogo en el momento de la
creación — base, salsas y proteína no tienen costo), y guardar
"Sin nombre" si nombre_cliente viene vacío. Devuelve el pedido
creado con su total.
