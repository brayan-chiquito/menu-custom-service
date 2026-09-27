import type { AppDatabase } from '../../shared/db.js';
import type { AuditoriaEntry } from './auditoria.types.js';

type Row = {
  id: number;
  usuario_id: number | null;
  usuario: string | null;
  nombre: string | null;
  accion: string;
  entidad: string;
  entidad_id: string | null;
  detalle: string | null;
  created_at: string;
};

export class AuditoriaRepository {
  constructor(private readonly db: AppDatabase) {}

  listar(limit: number, offset: number): { items: AuditoriaEntry[]; total: number } {
    const total = (
      this.db.prepare(`SELECT COUNT(*) AS n FROM auditoria`).get() as { n: number }
    ).n;

    const rows = this.db
      .prepare(
        `
        SELECT a.id, a.usuario_id, u.usuario, u.nombre, a.accion, a.entidad,
               a.entidad_id, a.detalle, a.created_at
        FROM auditoria a
        LEFT JOIN usuarios u ON u.id = a.usuario_id
        ORDER BY a.created_at DESC, a.id DESC
        LIMIT ? OFFSET ?
        `,
      )
      .all(limit, offset) as Row[];

    return {
      total,
      items: rows.map((row) => ({
        id: row.id,
        usuario_id: row.usuario_id,
        usuario: row.usuario,
        nombre: row.nombre,
        accion: row.accion,
        entidad: row.entidad,
        entidad_id: row.entidad_id,
        detalle: row.detalle,
        created_at: row.created_at,
      })),
    };
  }
}
