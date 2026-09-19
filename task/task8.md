Usando frontend/CONTEXT.md y prompts-ux.md (sección "Pantalla: Armar
pedido") como referencia, implementa la feature menu/: hook useMenu
que llama a GET /menu vía shared/api (menuApi), y componente MenuList
que renderiza los productos en grid con su descripción y precio. Al
tocar "+", abre un modal/bottom sheet donde el operador elige
obligatoriamente una base y una o más salsas (listas de /menu), y
—solo si `producto.requiere_proteina` es true— una proteína
(Carne/Pollo de `menu.proteinas`); si `requiere_proteina` es false,
no mostrar ese selector y enviar `proteina_id: null`. Los toppings
(`adiciones`) son opcionales y con costo. Solo cuando base + al
menos una salsa (+ proteína si aplica) estén elegidas se puede
agregar el ítem al pedido en curso (feature pedido-actual). Cada
ítem del carrito debe conservar producto_id, cantidad, base_id,
salsa_ids, proteina_id (o null) y adiciones[] para el POST /pedidos
posterior.
