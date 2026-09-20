import type { AppDatabase } from '../../shared/db.js';
import type {
  CatalogoAdicion,
  CatalogoProducto,
  CatalogoRef,
  Pedido,
  PedidoACrear,
  PedidoDetalle,
  PedidoItem,
  PedidoItemAdicion,
  PedidoResumen,
} from './pedidos.types.js';

type ProductoRow = {
  id: number;
  nombre: string;
  precio: number;
  disponible: number;
  requiere_proteina: number;
  categoria: string;
};

type AdicionRow = {
  id: number;
  nombre: string;
  precio: number;
  producto_id: number | null;
};

type RefRow = {
  id: number;
  nombre: string;
};

type PedidoRow = {
  id: number;
  nombre_cliente: string;
  total: number;
  monto_pagado: number | null;
  vuelto: number | null;
  estado: 'pendiente' | 'pagado';
  created_at: string;
};

type PedidoItemRow = {
  id: number;
  producto_id: number;
  cantidad: number;
  precio_unit_momento: number;
  base_id: number | null;
  proteina_id: number | null;
};

type PedidoItemAdicionRow = {
  id: number;
  adicion_id: number;
  precio_momento: number;
};

type PedidoItemSalsaRow = {
  id: number;
  salsa_id: number;
};

export class PedidosRepository {
  constructor(private readonly db: AppDatabase) {}

  findProductoById(id: number): CatalogoProducto | null {
    const row = this.db
      .prepare(
        `
        SELECT id, nombre, precio, disponible, requiere_proteina, categoria
        FROM productos
        WHERE id = ?
        `,
      )
      .get(id) as ProductoRow | undefined;

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      nombre: row.nombre,
      precio: row.precio,
      disponible: row.disponible === 1,
      requiere_proteina: row.requiere_proteina === 1,
      categoria: row.categoria,
    };
  }

  findAdicionById(id: number): CatalogoAdicion | null {
    const row = this.db
      .prepare(`SELECT id, nombre, precio, producto_id FROM adiciones WHERE id = ?`)
      .get(id) as AdicionRow | undefined;

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      nombre: row.nombre,
      precio: row.precio,
      producto_id: row.producto_id,
    };
  }

  findBaseById(id: number): CatalogoRef | null {
    return this.findRefById('bases', id);
  }

  findSalsaById(id: number): CatalogoRef | null {
    return this.findRefById('salsas', id);
  }

  findProteinaById(id: number): CatalogoRef | null {
    return this.findRefById('proteinas', id);
  }

  create(pedido: PedidoACrear): Pedido {
    const createTxn = this.db.transaction(() => {
      const result = this.db
        .prepare(
          `
          INSERT INTO pedidos (nombre_cliente, total, monto_pagado, vuelto, estado)
          VALUES (?, ?, NULL, NULL, 'pendiente')
          `,
        )
        .run(pedido.nombre_cliente, pedido.total);

      const pedidoId = Number(result.lastInsertRowid);

      const insertItem = this.db.prepare(
        `
        INSERT INTO pedido_items (
          pedido_id, producto_id, cantidad, precio_unit_momento, base_id, proteina_id
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `,
      );

      const insertSalsa = this.db.prepare(
        `
        INSERT INTO pedido_item_salsas (pedido_item_id, salsa_id)
        VALUES (?, ?)
        `,
      );

      const insertAdicion = this.db.prepare(
        `
        INSERT INTO pedido_item_adiciones (pedido_item_id, adicion_id, precio_momento)
        VALUES (?, ?, ?)
        `,
      );

      for (const item of pedido.items) {
        const itemResult = insertItem.run(
          pedidoId,
          item.producto_id,
          item.cantidad,
          item.precio_unit_momento,
          item.base_id,
          item.proteina_id,
        );
        const pedidoItemId = Number(itemResult.lastInsertRowid);

        for (const salsaId of item.salsa_ids) {
          insertSalsa.run(pedidoItemId, salsaId);
        }

        for (const adicion of item.adiciones) {
          insertAdicion.run(pedidoItemId, adicion.adicion_id, adicion.precio_momento);
        }
      }

      return pedidoId;
    });

    const pedidoId = createTxn();
    const creado = this.findById(pedidoId);

    if (!creado) {
      throw new Error(`No se pudo leer el pedido recién creado #${pedidoId}`);
    }

    return creado;
  }

  findByFechaHoy(): PedidoResumen[] {
    const rows = this.db
      .prepare(
        `
        SELECT id, nombre_cliente, total, monto_pagado, vuelto, estado, created_at
        FROM pedidos
        WHERE date(created_at) = date('now')
        ORDER BY created_at DESC, id DESC
        `,
      )
      .all() as PedidoRow[];

    return rows.map((row) => ({
      id: row.id,
      nombre_cliente: row.nombre_cliente,
      total: row.total,
      monto_pagado: row.monto_pagado,
      vuelto: row.vuelto,
      estado: row.estado,
      created_at: row.created_at,
    }));
  }

  findBalanceEntreFechas(desde: string, hasta: string): {
    cobrado: number;
    pedidos_pagados: number;
    pendiente: number;
    pedidos_pendientes: number;
  } {
    const row = this.db
      .prepare(
        `
        SELECT
          COALESCE(SUM(CASE WHEN estado = 'pagado' THEN total ELSE 0 END), 0) AS cobrado,
          COALESCE(SUM(CASE WHEN estado = 'pagado' THEN 1 ELSE 0 END), 0) AS pedidos_pagados,
          COALESCE(SUM(CASE WHEN estado = 'pendiente' THEN total ELSE 0 END), 0) AS pendiente,
          COALESCE(SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END), 0) AS pedidos_pendientes
        FROM pedidos
        WHERE date(created_at) >= date(?)
          AND date(created_at) <= date(?)
        `,
      )
      .get(desde, hasta) as {
      cobrado: number;
      pedidos_pagados: number;
      pendiente: number;
      pedidos_pendientes: number;
    };

    return {
      cobrado: row.cobrado,
      pedidos_pagados: row.pedidos_pagados,
      pendiente: row.pendiente,
      pedidos_pendientes: row.pedidos_pendientes,
    };
  }

  findById(id: number): Pedido | null {
    const pedido = this.db
      .prepare(
        `
        SELECT id, nombre_cliente, total, monto_pagado, vuelto, estado, created_at
        FROM pedidos
        WHERE id = ?
        `,
      )
      .get(id) as PedidoRow | undefined;

    if (!pedido) {
      return null;
    }

    const items = this.db
      .prepare(
        `
        SELECT id, producto_id, cantidad, precio_unit_momento, base_id, proteina_id
        FROM pedido_items
        WHERE pedido_id = ?
        ORDER BY id ASC
        `,
      )
      .all(id) as PedidoItemRow[];

    const adicionesStmt = this.db.prepare(
      `
      SELECT id, adicion_id, precio_momento
      FROM pedido_item_adiciones
      WHERE pedido_item_id = ?
      ORDER BY id ASC
      `,
    );

    const salsasStmt = this.db.prepare(
      `
      SELECT id, salsa_id
      FROM pedido_item_salsas
      WHERE pedido_item_id = ?
      ORDER BY id ASC
      `,
    );

    const itemsConAdiciones: PedidoItem[] = items.map((item) => {
      const salsas = (salsasStmt.all(item.id) as PedidoItemSalsaRow[]).map((salsa) => ({
        id: salsa.id,
        salsa_id: salsa.salsa_id,
      }));
      const adiciones = (adicionesStmt.all(item.id) as PedidoItemAdicionRow[]).map(
        (adicion): PedidoItemAdicion => ({
          id: adicion.id,
          adicion_id: adicion.adicion_id,
          precio_momento: adicion.precio_momento,
        }),
      );

      return {
        id: item.id,
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unit_momento: item.precio_unit_momento,
        base_id: item.base_id,
        salsa_ids: salsas.map((s) => s.salsa_id),
        salsas,
        proteina_id: item.proteina_id,
        adiciones,
      };
    });

    return {
      id: pedido.id,
      nombre_cliente: pedido.nombre_cliente,
      total: pedido.total,
      monto_pagado: pedido.monto_pagado,
      vuelto: pedido.vuelto,
      estado: pedido.estado,
      created_at: pedido.created_at,
      items: itemsConAdiciones,
    };
  }

  findDetalleParaNotificacion(id: number): {
    pedido: Pedido;
    lineas: Array<{
      producto_nombre: string;
      cantidad: number;
      base_nombre: string | null;
      salsa_nombres: string[];
      proteina_nombre: string | null;
      adiciones_nombres: string[];
    }>;
  } | null {
    const pedido = this.findById(id);
    if (!pedido) {
      return null;
    }

    const lineas = this.db
      .prepare(
        `
        SELECT
          pi.cantidad AS cantidad,
          p.nombre AS producto_nombre,
          b.nombre AS base_nombre,
          pr.nombre AS proteina_nombre,
          pi.id AS item_id
        FROM pedido_items pi
        INNER JOIN productos p ON p.id = pi.producto_id
        LEFT JOIN bases b ON b.id = pi.base_id
        LEFT JOIN proteinas pr ON pr.id = pi.proteina_id
        WHERE pi.pedido_id = ?
        ORDER BY pi.id ASC
        `,
      )
      .all(id) as Array<{
      cantidad: number;
      producto_nombre: string;
      base_nombre: string | null;
      proteina_nombre: string | null;
      item_id: number;
    }>;

    const salsasStmt = this.db.prepare(
      `
      SELECT s.nombre
      FROM pedido_item_salsas pis
      INNER JOIN salsas s ON s.id = pis.salsa_id
      WHERE pis.pedido_item_id = ?
      ORDER BY pis.id ASC
      `,
    );

    const adicionesStmt = this.db.prepare(
      `
      SELECT a.nombre
      FROM pedido_item_adiciones pia
      INNER JOIN adiciones a ON a.id = pia.adicion_id
      WHERE pia.pedido_item_id = ?
      ORDER BY pia.id ASC
      `,
    );

    return {
      pedido,
      lineas: lineas.map((linea) => ({
        producto_nombre: linea.producto_nombre,
        cantidad: linea.cantidad,
        base_nombre: linea.base_nombre,
        salsa_nombres: (salsasStmt.all(linea.item_id) as Array<{ nombre: string }>).map(
          (s) => s.nombre,
        ),
        proteina_nombre: linea.proteina_nombre,
        adiciones_nombres: (
          adicionesStmt.all(linea.item_id) as Array<{ nombre: string }>
        ).map((a) => a.nombre),
      })),
    };
  }

  findDetalleVista(id: number): PedidoDetalle | null {
    const pedido = this.findById(id);
    if (!pedido) {
      return null;
    }

    const lineas = this.db
      .prepare(
        `
        SELECT
          pi.id AS item_id,
          pi.cantidad AS cantidad,
          pi.precio_unit_momento AS precio_unit_momento,
          p.nombre AS producto_nombre,
          b.nombre AS base_nombre,
          pr.nombre AS proteina_nombre
        FROM pedido_items pi
        INNER JOIN productos p ON p.id = pi.producto_id
        LEFT JOIN bases b ON b.id = pi.base_id
        LEFT JOIN proteinas pr ON pr.id = pi.proteina_id
        WHERE pi.pedido_id = ?
        ORDER BY pi.id ASC
        `,
      )
      .all(id) as Array<{
      item_id: number;
      cantidad: number;
      precio_unit_momento: number;
      producto_nombre: string;
      base_nombre: string | null;
      proteina_nombre: string | null;
    }>;

    const salsasStmt = this.db.prepare(
      `
      SELECT s.nombre
      FROM pedido_item_salsas pis
      INNER JOIN salsas s ON s.id = pis.salsa_id
      WHERE pis.pedido_item_id = ?
      ORDER BY pis.id ASC
      `,
    );

    const adicionesStmt = this.db.prepare(
      `
      SELECT a.nombre AS nombre, pia.precio_momento AS precio_momento
      FROM pedido_item_adiciones pia
      INNER JOIN adiciones a ON a.id = pia.adicion_id
      WHERE pia.pedido_item_id = ?
      ORDER BY pia.id ASC
      `,
    );

    return {
      id: pedido.id,
      nombre_cliente: pedido.nombre_cliente,
      total: pedido.total,
      monto_pagado: pedido.monto_pagado,
      vuelto: pedido.vuelto,
      estado: pedido.estado,
      created_at: pedido.created_at,
      lineas: lineas.map((linea) => {
        const adiciones = (
          adicionesStmt.all(linea.item_id) as Array<{ nombre: string; precio_momento: number }>
        ).map((a) => ({
          nombre: a.nombre,
          precio_momento: a.precio_momento,
        }));
        const extras = adiciones.reduce((sum, a) => sum + a.precio_momento, 0);
        const subtotal = linea.cantidad * (linea.precio_unit_momento + extras);
        return {
          cantidad: linea.cantidad,
          producto_nombre: linea.producto_nombre,
          base_nombre: linea.base_nombre,
          salsa_nombres: (salsasStmt.all(linea.item_id) as Array<{ nombre: string }>).map(
            (s) => s.nombre,
          ),
          proteina_nombre: linea.proteina_nombre,
          adiciones,
          precio_unit_momento: linea.precio_unit_momento,
          subtotal,
        };
      }),
    };
  }

  registrarPago(id: number, montoPagado: number, vuelto: number): Pedido {
    const result = this.db
      .prepare(
        `
        UPDATE pedidos
        SET monto_pagado = ?, vuelto = ?
        WHERE id = ?
        `,
      )
      .run(montoPagado, vuelto, id);

    if (result.changes === 0) {
      throw new Error(`Pedido #${id} no encontrado al registrar pago`);
    }

    const actualizado = this.findById(id);
    if (!actualizado) {
      throw new Error(`No se pudo leer el pedido #${id} tras registrar pago`);
    }

    return actualizado;
  }

  marcarPagado(id: number): Pedido {
    const result = this.db
      .prepare(
        `
        UPDATE pedidos
        SET estado = 'pagado'
        WHERE id = ? AND estado = 'pendiente'
        `,
      )
      .run(id);

    if (result.changes === 0) {
      throw new Error(`No se pudo marcar como pagado el pedido #${id}`);
    }

    const actualizado = this.findById(id);
    if (!actualizado) {
      throw new Error(`No se pudo leer el pedido #${id} tras confirmar`);
    }

    return actualizado;
  }

  private findRefById(tabla: 'bases' | 'salsas' | 'proteinas', id: number): CatalogoRef | null {
    const row = this.db
      .prepare(`SELECT id, nombre FROM ${tabla} WHERE id = ?`)
      .get(id) as RefRow | undefined;

    if (!row) {
      return null;
    }

    return { id: row.id, nombre: row.nombre };
  }
}
