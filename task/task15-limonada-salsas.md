# Plan — Limonada maracuyá + salsas opcionales

## Cambios
1. **Limonada de coco → Limonada de maracuyá** ($3.000, bebida).
2. **Salsas opcionales** en platos (base sigue obligatoria; proteína si aplica).

## Ejecución (esta iteración = solo QA)
1. Seed: renombrar producto legacy + upsert maracuyá.
2. Backend: `salsa_ids` puede ir `[]`; si vienen IDs, se validan.
3. Frontend: modal permite Agregar sin salsa; copy “salsas opcionales”.
4. Tests + docs mínimas.
5. Reseed QA (`menu-qa.db`); **no** Docker / prod.
6. Tú validas en `:5174` → OK → backup + deploy prod (mismo cuidado que antes).

## Prod (después de tu OK)
- Backup `menu.db` + `wwebjs-session`
- Merge a `develop` si hace falta
- `docker compose up --build -d` (volúmenes intactos)
- Verificar pedidos, limonada maracuyá, WhatsApp “Cliente listo”
