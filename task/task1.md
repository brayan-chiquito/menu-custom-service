Crea la estructura base de un monorepo con dos carpetas: backend/ y
frontend/. En backend/, inicializa un proyecto Node.js + TypeScript +
Express con la estructura de carpetas descrita en backend/CONTEXT.md
(modules/productos, modules/pedidos, modules/notificaciones, shared/).
En frontend/, inicializa un proyecto React + Vite + TypeScript con la
estructura descrita en frontend/CONTEXT.md (features/, shared/).
No implementes lógica de negocio todavía, solo el scaffolding, un
endpoint de healthcheck en backend (GET /health) y una pantalla en
blanco en frontend que confirme que puede llamar a ese healthcheck.
Agrega Dockerfile básico a cada carpeta y un docker-compose.yml en la
raíz que levante ambos servicios.