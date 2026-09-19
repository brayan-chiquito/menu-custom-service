import type { AppDatabase } from '../shared/db.js';

type UpsertProducto = {
  nombre: string;
  precio: number;
  descripcion: string;
  requiere_proteina: boolean;
  categoria?: string;
};

const BASES = ['Maduro', 'Verde'];
const SALSAS = ['Ajo', 'Agridulce', 'Ranchera', 'BBQ'];
const PROTEINAS = ['Carne', 'Pollo'];

const ADICIONES: Array<{ nombre: string; precio: number }> = [
  { nombre: 'Huevos de Codorniz (4 Unds)', precio: 2000 },
  { nombre: 'Chicharrón', precio: 3500 },
  { nombre: 'Chorizo', precio: 2500 },
  { nombre: 'Guacamole', precio: 2000 },
  { nombre: 'Extra Queso', precio: 2500 },
];

const PRODUCTOS: UpsertProducto[] = [
  {
    nombre: 'Pacífico',
    precio: 24000,
    descripcion: 'Camarones al ajillo + Guacamole + Pico de Gallo + Queso Gratinado',
    requiere_proteina: false,
  },
  {
    nombre: 'Candente',
    precio: 22000,
    descripcion:
      'Carne o Pollo Desmechado + Chicharrón + Guacamole + Pico de Gallo + Queso Gratinado',
    requiere_proteina: true,
  },
  {
    nombre: 'Chicharronero',
    precio: 20000,
    descripcion: 'Carne o Pollo Desmechado + Chicharrón + Maíz Tierno + Queso Gratinado',
    requiere_proteina: true,
  },
  {
    nombre: 'Apoteósico',
    precio: 20000,
    descripcion: 'Carne y Pollo Desmechado + Chorizo + Maíz Tierno + Queso Gratinado',
    requiere_proteina: false,
  },
  {
    nombre: 'Cachaco',
    precio: 17000,
    descripcion: 'Pollo Desmechado + Maíz Tierno + Huevos de Codorniz + Queso Gratinado',
    requiere_proteina: false,
  },
  {
    nombre: 'Chorimaduro',
    precio: 17000,
    descripcion: 'Maduro + Chorizo Premium + Huevos de Codorniz + Queso Gratinado',
    requiere_proteina: false,
  },
  {
    nombre: 'Quesudo',
    precio: 10000,
    descripcion: 'Extra Queso + Dulce de Guayaba',
    requiere_proteina: false,
  },
  {
    nombre: 'Limonada de coco',
    precio: 3000,
    descripcion: 'Bebida fría de limón y coco',
    requiere_proteina: false,
    categoria: 'bebidas',
  },
];

export function seedMenu(db: AppDatabase): void {
  const upsertBase = db.prepare(
    `INSERT INTO bases (nombre) VALUES (?) ON CONFLICT(nombre) DO NOTHING`,
  );
  const upsertSalsa = db.prepare(
    `INSERT INTO salsas (nombre) VALUES (?) ON CONFLICT(nombre) DO NOTHING`,
  );
  const upsertProteina = db.prepare(
    `INSERT INTO proteinas (nombre) VALUES (?) ON CONFLICT(nombre) DO NOTHING`,
  );

  const upsertAdicion = db.prepare(
    `
    INSERT INTO adiciones (nombre, precio, producto_id)
    VALUES (?, ?, NULL)
    ON CONFLICT(nombre) DO UPDATE SET
      precio = excluded.precio,
      producto_id = NULL
    `,
  );

  const upsertProducto = db.prepare(
    `
    INSERT INTO productos (nombre, descripcion, precio, categoria, disponible, requiere_proteina)
    VALUES (?, ?, ?, ?, 1, ?)
    ON CONFLICT(nombre) DO UPDATE SET
      descripcion = excluded.descripcion,
      precio = excluded.precio,
      categoria = excluded.categoria,
      disponible = 1,
      requiere_proteina = excluded.requiere_proteina
    `,
  );

  const txn = db.transaction(() => {
    for (const nombre of BASES) {
      upsertBase.run(nombre);
    }
    for (const nombre of SALSAS) {
      upsertSalsa.run(nombre);
    }
    for (const nombre of PROTEINAS) {
      upsertProteina.run(nombre);
    }
    for (const adicion of ADICIONES) {
      upsertAdicion.run(adicion.nombre, adicion.precio);
    }
    for (const producto of PRODUCTOS) {
      upsertProducto.run(
        producto.nombre,
        producto.descripcion,
        producto.precio,
        producto.categoria ?? 'platos',
        producto.requiere_proteina ? 1 : 0,
      );
    }
  });

  txn();
}
