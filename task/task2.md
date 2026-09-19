Usando backend/CONTEXT.md como referencia de arquitectura y modelo de
datos, crea las tablas productos (con descripcion y requiere_proteina),
bases, salsas, proteinas y adiciones (según el modelo de datos del
contexto). Implementa repository, service y controller para GET /menu,
que devuelva en una sola respuesta: productos disponibles (con
descripción, requiere_proteina y sus adiciones globales asociadas),
la lista de bases, la lista de salsas y la lista de proteinas
(Carne, Pollo). Agrega restricción de nombre único en productos,
bases, salsas, proteinas y adiciones. Sigue la separación
controller → service → repository, sin lógica de negocio en el
controller.

Nota de dominio: `requiere_proteina = true` significa que el operador
debe elegir Carne o Pollo al armar el ítem (ej. Candente,
Chicharronero). Productos que ya traen ambas proteínas o una fija
(ej. Apoteósico “Carne y Pollo”, Cachaco solo Pollo) van con
`requiere_proteina = false` y no exigen `proteina_id`.
