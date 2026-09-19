Configura el frontend como PWA instalable (manifest.json + service
worker mínimo con Vite PWA plugin). Asegúrate de que la URL base de la
API se lea de VITE_API_BASE_URL (.env), sin URLs hardcodeadas en el
código, para poder apuntar a la IP de Tailscale del PC sin tocar
código fuente. Todas las llamadas (incluido GET /menu y pedidos) deben
pasar por shared/api usando esa base.
