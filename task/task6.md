Implementa WhatsAppNotificador usando whatsapp-web.js, cumpliendo la
interfaz Notificador ya definida. Al enviar, arma un mensaje de texto
con: nombre del cliente, cada producto con cantidad, base, salsa y
sus adiciones, y el total del pedido. Si el envío falla, debe loggear
el error y resolver la promesa igual (no debe lanzar una excepción
que revierta la confirmación del pago, según la regla de negocio de
backend/CONTEXT.md). Configura la persistencia de sesión en un volumen
para no tener que escanear el QR en cada reinicio del contenedor.