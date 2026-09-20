import type { AppDatabase } from '../../shared/db.js';
import type {
  Adicion,
  Base,
  MenuResponse,
  ProductoConAdiciones,
  Proteina,
  Salsa,
} from './productos.types.js';

type ProductoRow = {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  disponible: number;
  requiere_proteina: number;
};

type AdicionRow = {
  id: number;
  nombre: string;
  precio: number;
  producto_id: number | null;
};

type NombreRow = {
  id: number;
  nombre: string;
};

export class ProductosRepository {
  constructor(private readonly db: AppDatabase) {}

  findMenu(): MenuResponse {
    const productos = this.db
      .prepare(
        `
        SELECT id, nombre, descripcion, precio, categoria, disponible, requiere_proteina
        FROM productos
        WHERE disponible = 1
        ORDER BY id ASC
        `,
      )
      .all() as ProductoRow[];

    const adicionesGlobales = this.db
      .prepare(
        `
        SELECT id, nombre, precio, producto_id
        FROM adiciones
        WHERE producto_id IS NULL
        ORDER BY id ASC
        `,
      )
      .all() as AdicionRow[];

    const adicionesPorProducto = this.db
      .prepare(
        `
        SELECT id, nombre, precio, producto_id
        FROM adiciones
        WHERE producto_id IS NOT NULL
        ORDER BY id ASC
        `,
      )
      .all() as AdicionRow[];

    const globales = adicionesGlobales.map(mapAdicion);
    const propiasPorProducto = new Map<number, Adicion[]>();

    for (const row of adicionesPorProducto) {
      if (row.producto_id === null) {
        continue;
      }
      const lista = propiasPorProducto.get(row.producto_id) ?? [];
      lista.push(mapAdicion(row));
      propiasPorProducto.set(row.producto_id, lista);
    }

    const productosConAdiciones: ProductoConAdiciones[] = productos.map((producto) => ({
      id: producto.id,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      categoria: producto.categoria,
      disponible: producto.disponible === 1,
      requiere_proteina: producto.requiere_proteina === 1,
      adiciones: [...(propiasPorProducto.get(producto.id) ?? []), ...globales],
    }));

    return {
      productos: productosConAdiciones,
      bases: this.listarNombres('bases') as Base[],
      salsas: this.listarNombres('salsas') as Salsa[],
      proteinas: this.listarNombres('proteinas') as Proteina[],
    };
  }

  private listarNombres(tabla: 'bases' | 'salsas' | 'proteinas'): NombreRow[] {
    return this.db
      .prepare(`SELECT id, nombre FROM ${tabla} ORDER BY id ASC`)
      .all() as NombreRow[];
  }
}

function mapAdicion(row: AdicionRow): Adicion {
  return {
    id: row.id,
    nombre: row.nombre,
    precio: row.precio,
    producto_id: row.producto_id,
  };
}
