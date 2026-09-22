import type { AppDatabase } from '../../shared/db.js';
import { sqlDateBogota } from '../../shared/time.js';
import type { CrearEgresoInput, Egreso } from './egresos.types.js';

type EgresoRow = {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
  total: number;
  created_at: string;
};

export class EgresosRepository {
  constructor(private readonly db: AppDatabase) {}

  create(input: CrearEgresoInput & { total: number }): Egreso {
    const result = this.db
      .prepare(
        `
        INSERT INTO egresos (nombre, precio, cantidad, total)
        VALUES (?, ?, ?, ?)
        `,
      )
      .run(input.nombre, input.precio, input.cantidad, input.total);

    const row = this.db
      .prepare(
        `
        SELECT id, nombre, precio, cantidad, total, created_at
        FROM egresos
        WHERE id = ?
        `,
      )
      .get(Number(result.lastInsertRowid)) as EgresoRow;

    return row;
  }

  findEntreFechas(desde: string, hasta: string): Egreso[] {
    const dia = sqlDateBogota('created_at');
    return this.db
      .prepare(
        `
        SELECT id, nombre, precio, cantidad, total, created_at
        FROM egresos
        WHERE ${dia} >= date(?)
          AND ${dia} <= date(?)
        ORDER BY created_at DESC, id DESC
        `,
      )
      .all(desde, hasta) as EgresoRow[];
  }

  sumTotalEntreFechas(desde: string, hasta: string): number {
    const dia = sqlDateBogota('created_at');
    const row = this.db
      .prepare(
        `
        SELECT COALESCE(SUM(total), 0) AS gastos
        FROM egresos
        WHERE ${dia} >= date(?)
          AND ${dia} <= date(?)
        `,
      )
      .get(desde, hasta) as { gastos: number };
    return row.gastos;
  }
}
