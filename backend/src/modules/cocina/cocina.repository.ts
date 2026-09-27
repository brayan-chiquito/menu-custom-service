import type { AppDatabase } from '../../shared/db.js';
import { formatFechaBogota, sqlDateBogota } from '../../shared/time.js';
import type { CocinaPedido } from './cocina.types.js';

type PedidoRow = {
  id: number;
  nombre_cliente: string;
  estado: 'pendiente' | 'pagado';
  indicaciones: string | null;
  created_at: string;
};

export class CocinaRepository {
  constructor(private readonly db: AppDatabase) {}

  listarColaHoy(): CocinaPedido[] {
    const hoy = formatFechaBogota();
    const rows = this.db
      .prepare(
        `
        SELECT id, nombre_cliente, estado, indicaciones, created_at
        FROM pedidos
        WHERE eliminado_at IS NULL
          AND preparado_at IS NULL
          AND estado IN ('pendiente', 'pagado')
          AND ${sqlDateBogota('created_at')} = date(?)
        ORDER BY created_at ASC, id ASC
        `,
      )
      .all(hoy) as PedidoRow[];

    return rows.map((row) => ({
      id: row.id,
      nombre_cliente: row.nombre_cliente,
      estado: row.estado,
      indicaciones: row.indicaciones,
      created_at: row.created_at,
      items: this.itemsDePedido(row.id, row.indicaciones),
    }));
  }

  private itemsDePedido(
    pedidoId: number,
    indicacionesPedido: string | null,
  ): CocinaPedido['items'] {
    const lineas = this.db
      .prepare(
        `
        SELECT
          pi.id AS item_id,
          pi.cantidad AS cantidad,
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
      .all(pedidoId) as Array<{
      item_id: number;
      cantidad: number;
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
      SELECT a.nombre
      FROM pedido_item_adiciones pia
      INNER JOIN adiciones a ON a.id = pia.adicion_id
      WHERE pia.pedido_item_id = ?
      ORDER BY pia.id ASC
      `,
    );

    return lineas.map((linea) => {
      const extras: string[] = [];
      if (linea.base_nombre) {
        extras.push(`base: ${linea.base_nombre}`);
      }
      const salsas = (salsasStmt.all(linea.item_id) as Array<{ nombre: string }>).map(
        (s) => s.nombre,
      );
      if (salsas.length > 0) {
        extras.push(`salsas: ${salsas.join(', ')}`);
      }
      if (linea.proteina_nombre) {
        extras.push(`proteína: ${linea.proteina_nombre}`);
      }
      const adiciones = (adicionesStmt.all(linea.item_id) as Array<{ nombre: string }>).map(
        (a) => a.nombre,
      );
      if (adiciones.length > 0) {
        extras.push(`extras: ${adiciones.join(', ')}`);
      }

      return {
        producto_nombre: linea.producto_nombre,
        cantidad: linea.cantidad,
        extras,
        indicaciones: indicacionesPedido,
      };
    });
  }
}
