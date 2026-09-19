Crea un script backend/src/seed/seed.ts (ejecutable con un comando
npm, ej. "npm run seed") que inserte o actualice (upsert por
`nombre`, sin duplicar filas) los siguientes datos:

Bases: Maduro, Verde

Salsas: Ajo, Agridulce, Ranchera, BBQ

Proteínas: Carne, Pollo
(catálogo de elección; no incluir “ambos” como opción — los platos
que ya traen las dos van con requiere_proteina=false)

Toppings adicionales (tabla adiciones, producto_id null = global):
- Huevos de Codorniz (4 Unds): 2000
- Chicharrón: 3500
- Chorizo: 2500
- Guacamole: 2000
- Extra Queso: 2500

Productos (nombre, precio, descripcion, requiere_proteina):
- Pacífico, 24000, "Camarones al ajillo + Guacamole + Pico de Gallo + Queso Gratinado", false
- Candente, 22000, "Carne o Pollo Desmechado + Chicharrón + Guacamole + Pico de Gallo + Queso Gratinado", true
- Chicharronero, 20000, "Carne o Pollo Desmechado + Chicharrón + Maíz Tierno + Queso Gratinado", true
- Apoteósico, 20000, "Carne y Pollo Desmechado + Chorizo + Maíz Tierno + Queso Gratinado", false
- Cachaco, 17000, "Pollo Desmechado + Maíz Tierno + Huevos de Codorniz + Queso Gratinado", false
- Chorimaduro, 17000, "Maduro + Chorizo Premium + Huevos de Codorniz + Queso Gratinado", false
- Quesudo, 10000, "Extra Queso + Dulce de Guayaba", false

El script debe ser re-ejecutable en cualquier momento para corregir
precios, descripciones, flags de proteína o agregar/quitar toppings
sin duplicar registros existentes (upsert por nombre, no insert
simple).
