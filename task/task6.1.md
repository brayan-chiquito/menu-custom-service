Extiende PATCH /pedidos/:id/confirmar para que la respuesta incluya
siempre el resultado de la notificación, de modo que el frontend
pueda mostrar feedback y ofrecer "Copiar pedido" si WhatsApp falló.

Forma de la respuesta (además del pedido pagado):
```json
{
  "id": 1,
  "estado": "pagado",
  "...": "...",
  "notificacion": {
    "enviada": false,
    "mensaje": "Pedido #1\nCliente: Ana\n..."
  }
}
```

Reglas:
- `mensaje` es el texto formateado del pedido (mismo que se intenta
  enviar por WhatsApp), siempre presente para poder copiarlo.
- `enviada: true` si el Notificador reporta éxito; `false` si falla
  o el cliente no está listo.
- El Notificador NO debe lanzar excepciones que reviertan el pago:
  devolver `{ enviada: false }` y loggear. El pedido permanece
  `pagado` en ambos casos.
- Actualizar FakeNotificador y WhatsappNotificador para reportar el
  resultado; tests automatizados + curl/Bruno en backend/README.md.
