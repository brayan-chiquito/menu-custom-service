Implementa las features pedido-actual/ (edición de cantidades, campo
de nombre opcional, botón ir a cobrar) y cobro/ (input de monto
recibido, cálculo de vuelto en tiempo real, botón "Confirmar pago"
deshabilitado si el monto es insuficiente), siguiendo los prompts UX
de prompts-ux.md secciones 2 y 3.

Al ir a cobrar / confirmar el flujo:
1. POST /pedidos con el carrito (nombre_cliente vacío/null si no hay
   nombre; cada item con producto_id, cantidad, base_id, salsa_ids[],
   proteina_id o null, adiciones[])
2. PATCH /pedidos/:id/pago con monto_pagado
3. PATCH /pedidos/:id/confirmar

Muestra feedback de si el WhatsApp se envió o no sin bloquear ni
revertir la pantalla (el pedido ya quedó pagado). Si WhatsApp falla,
mostrar botón "Copiar pedido" para copiar el mensaje al portapapeles
y enviarlo manualmente. No duplicar en el frontend la lógica de
"Sin nombre": enviar vacío/null y dejar que el backend lo resuelva.
