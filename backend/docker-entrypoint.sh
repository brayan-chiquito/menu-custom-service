#!/bin/sh
set -e
echo "[entrypoint] Seed menú…"
node dist/seed/run-seed.js
echo "[entrypoint] Arrancando API…"
exec node dist/server.js
