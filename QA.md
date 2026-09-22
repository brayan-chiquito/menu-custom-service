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
2. **Detalles** abre bottom sheet; cerrar con ✕ o toque fuera.
3. **Historial** muestra pedidos de días anteriores; **Cargar más** de 10 en 10.
4. Pedidos pagados muestran badge **Efectivo** o **Transfer** junto a Pagado.
5. **Cobrar** con checkbox **Transferencia** → confirmar.
6. **Balance** Hoy/Semana/Mes en hora Colombia; gastos y ganancia.
7. **Egresos** desde Balance → restan en ganancia.
8. Flujo **Ir a cobrar** (inmediato) sigue funcionando.
9. **⚙ Ajustes**: CRUD productos (toggle proteína), toppings, bases, salsas, proteínas; ver reflejo en Menú.
10. Historial **Detalles** → Editar / Eliminar (soft-delete; pagados también editables).
11. Resumen: checkbox **Indicaciones especiales** → textarea; salen en WhatsApp; nombre limpio.
12. Historial filtro **Eliminados** → **Restaurar** (vuelve al listado/balance).
13. Balance → **Exportar Excel** del periodo (Hoy/Semana/Mes); botón al pie.
14. Alertas visibles si falla red o una acción (cerrar con ✕).

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
