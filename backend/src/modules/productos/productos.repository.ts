import type { AppDatabase } from '../../shared/db.js';
import type {
  Adicion,
  Base,
  MenuResponse,
  Producto,
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

type NombreTabla = 'bases' | 'salsas' | 'proteinas';

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
      ...mapProducto(producto),
      adiciones: [...(propiasPorProducto.get(producto.id) ?? []), ...globales],
    }));

    return {
      productos: productosConAdiciones,
      bases: this.listarNombres('bases') as Base[],
      salsas: this.listarNombres('salsas') as Salsa[],
      proteinas: this.listarNombres('proteinas') as Proteina[],
    };
  }

  listProductosAdmin(): Producto[] {
    const rows = this.db
      .prepare(
        `
        SELECT id, nombre, descripcion, precio, categoria, disponible, requiere_proteina
        FROM productos
        ORDER BY id ASC
        `,
      )
      .all() as ProductoRow[];
    return rows.map(mapProducto);
  }

  findProductoById(id: number): Producto | null {
    const row = this.db
      .prepare(
        `
        SELECT id, nombre, descripcion, precio, categoria, disponible, requiere_proteina
        FROM productos
        WHERE id = ?
        `,
      )
      .get(id) as ProductoRow | undefined;
    return row ? mapProducto(row) : null;
  }

  createProducto(input: {
    nombre: string;
    descripcion: string;
    precio: number;
    categoria: string;
    disponible: boolean;
    requiere_proteina: boolean;
  }): Producto {
    const result = this.db
      .prepare(
        `
        INSERT INTO productos (nombre, descripcion, precio, categoria, disponible, requiere_proteina)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
      )
      .run(
        input.nombre,
        input.descripcion,
        input.precio,
        input.categoria,
        input.disponible ? 1 : 0,
        input.requiere_proteina ? 1 : 0,
      );
    const created = this.findProductoById(Number(result.lastInsertRowid));
    if (!created) {
      throw new Error('No se pudo leer el producto recién creado');
    }
    return created;
  }

  updateProducto(
    id: number,
    input: {
      nombre: string;
      descripcion: string;
      precio: number;
      categoria: string;
      disponible: boolean;
      requiere_proteina: boolean;
    },
  ): Producto {
    this.db
      .prepare(
        `
        UPDATE productos
        SET nombre = ?, descripcion = ?, precio = ?, categoria = ?, disponible = ?, requiere_proteina = ?
        WHERE id = ?
        `,
      )
      .run(
        input.nombre,
        input.descripcion,
        input.precio,
        input.categoria,
        input.disponible ? 1 : 0,
        input.requiere_proteina ? 1 : 0,
        id,
      );
    const updated = this.findProductoById(id);
    if (!updated) {
      throw new Error(`Producto #${id} no encontrado tras update`);
    }
    return updated;
  }

  countPedidoItemsByProducto(id: number): number {
    return (
      this.db.prepare(`SELECT COUNT(*) AS n FROM pedido_items WHERE producto_id = ?`).get(id) as {
        n: number;
      }
    ).n;
  }

  deleteProducto(id: number): void {
    this.db.prepare(`DELETE FROM productos WHERE id = ?`).run(id);
  }

  listAdiciones(): Adicion[] {
    const rows = this.db
      .prepare(
        `
        SELECT id, nombre, precio, producto_id
        FROM adiciones
        ORDER BY id ASC
        `,
      )
      .all() as AdicionRow[];
    return rows.map(mapAdicion);
  }

  findAdicionById(id: number): Adicion | null {
    const row = this.db
      .prepare(`SELECT id, nombre, precio, producto_id FROM adiciones WHERE id = ?`)
      .get(id) as AdicionRow | undefined;
    return row ? mapAdicion(row) : null;
  }

  createAdicion(input: {
    nombre: string;
    precio: number;
    producto_id: number | null;
  }): Adicion {
    const result = this.db
      .prepare(
        `
        INSERT INTO adiciones (nombre, precio, producto_id)
        VALUES (?, ?, ?)
        `,
      )
      .run(input.nombre, input.precio, input.producto_id);
    const created = this.findAdicionById(Number(result.lastInsertRowid));
    if (!created) {
      throw new Error('No se pudo leer la adición recién creada');
    }
    return created;
  }

  updateAdicion(
    id: number,
    input: { nombre: string; precio: number; producto_id: number | null },
  ): Adicion {
    this.db
      .prepare(
        `
        UPDATE adiciones
        SET nombre = ?, precio = ?, producto_id = ?
        WHERE id = ?
        `,
      )
      .run(input.nombre, input.precio, input.producto_id, id);
    const updated = this.findAdicionById(id);
    if (!updated) {
      throw new Error(`Adición #${id} no encontrada tras update`);
    }
    return updated;
  }

  countPedidoItemAdiciones(id: number): number {
    return (
      this.db
        .prepare(`SELECT COUNT(*) AS n FROM pedido_item_adiciones WHERE adicion_id = ?`)
        .get(id) as { n: number }
    ).n;
  }

  deleteAdicion(id: number): void {
    this.db.prepare(`DELETE FROM adiciones WHERE id = ?`).run(id);
  }

  listNombres(tabla: NombreTabla): Array<{ id: number; nombre: string }> {
    return this.listarNombres(tabla);
  }

  findNombreById(tabla: NombreTabla, id: number): { id: number; nombre: string } | null {
    const row = this.db
      .prepare(`SELECT id, nombre FROM ${tabla} WHERE id = ?`)
      .get(id) as NombreRow | undefined;
    return row ?? null;
  }

  createNombre(tabla: NombreTabla, nombre: string): { id: number; nombre: string } {
    const result = this.db.prepare(`INSERT INTO ${tabla} (nombre) VALUES (?)`).run(nombre);
    const created = this.findNombreById(tabla, Number(result.lastInsertRowid));
    if (!created) {
      throw new Error(`No se pudo leer ${tabla} recién creado`);
    }
    return created;
  }

  updateNombre(tabla: NombreTabla, id: number, nombre: string): { id: number; nombre: string } {
    this.db.prepare(`UPDATE ${tabla} SET nombre = ? WHERE id = ?`).run(nombre, id);
    const updated = this.findNombreById(tabla, id);
    if (!updated) {
      throw new Error(`${tabla} #${id} no encontrado tras update`);
    }
    return updated;
  }

  countRefsNombre(tabla: NombreTabla, id: number): number {
    if (tabla === 'bases') {
      return (
        this.db.prepare(`SELECT COUNT(*) AS n FROM pedido_items WHERE base_id = ?`).get(id) as {
          n: number;
        }
      ).n;
    }
    if (tabla === 'proteinas') {
      return (
        this.db.prepare(`SELECT COUNT(*) AS n FROM pedido_items WHERE proteina_id = ?`).get(id) as {
          n: number;
        }
      ).n;
    }
    return (
      this.db
        .prepare(`SELECT COUNT(*) AS n FROM pedido_item_salsas WHERE salsa_id = ?`)
        .get(id) as { n: number }
    ).n;
  }

  deleteNombre(tabla: NombreTabla, id: number): void {
    this.db.prepare(`DELETE FROM ${tabla} WHERE id = ?`).run(id);
  }

  private listarNombres(tabla: NombreTabla): NombreRow[] {
    return this.db
      .prepare(`SELECT id, nombre FROM ${tabla} ORDER BY id ASC`)
      .all() as NombreRow[];
  }
}

function mapProducto(row: ProductoRow): Producto {
  return {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    precio: row.precio,
    categoria: row.categoria,
    disponible: row.disponible === 1,
    requiere_proteina: row.requiere_proteina === 1,
  };
}

function mapAdicion(row: AdicionRow): Adicion {
  return {
    id: row.id,
    nombre: row.nombre,
    precio: row.precio,
    producto_id: row.producto_id,
  };
}
