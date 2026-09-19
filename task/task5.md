Agrega a pedidos: PATCH /pedidos/:id/pago que reciba monto_pagado,
valide que sea >= total (si no, responde 400 con el monto faltante),
calcule y devuelva el vuelto sin cambiar el estado todavía. Agrega
PATCH /pedidos/:id/confirmar que cambie el estado de 'pendiente' a
'pagado' y dispare la notificación a través de la interfaz
Notificador (aún sin implementación real de WhatsApp, usa un
notificador "fake" que solo loggea, siguiendo el patrón de
inyección por constructor descrito en backend/CONTEXT.md).