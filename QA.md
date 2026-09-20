# Ambiente QA (validar antes de prod)

Corre **en paralelo** al Docker de producción, sin reemplazarlo.

| | Prod (Docker) | QA (esta rama) |
|--|---------------|----------------|
| UI | `:5173` | `:5174` |
| API | `:3000` | `:3001` |
| BD | `backend/data/menu.db` | `backend/data/menu-qa.db` |
| WhatsApp | sesión real | simulado (Fake) |

## Abrir QA

- En el PC: http://localhost:5174  
- En el celular (Tailscale): http://100.119.141.96:5174  

## Qué probar

1. Armar pedido → **Guardar sin pagar** → Historial (Pendientes).
2. **Detalles** abre bottom sheet (header/filtros quedan fijos); cerrar con ✕ o toque fuera.
3. **Balance** desde Historial → Hoy/Semana/Mes (cobrado, ticket, pendientes).
4. **Cobrar** un pendiente → pago → confirmación.
5. Flujo normal **Ir a cobrar** (inmediato) sigue funcionando.

## Arrancar QA de nuevo (si se apagó)

```powershell
cd "C:\Users\braya\Desktop\proyecto menu\backend"
$env:QA='1'; $env:PORT='3001'; $env:DATABASE_PATH='data/menu-qa.db'; $env:WWEBJS_AUTH_PATH='.wwebjs_auth_qa'
npm run seed; npm run dev

# otra terminal
cd "C:\Users\braya\Desktop\proyecto menu\frontend"
npx vite --mode qa --port 5174 --host --strictPort
```

## Pasar a prod (solo cuando des OK)

```powershell
cd "C:\Users\braya\Desktop\proyecto menu"
docker compose up --build -d
```

Eso actualiza solo los contenedores; la sesión WhatsApp en `backend/wwebjs-session` se conserva.
