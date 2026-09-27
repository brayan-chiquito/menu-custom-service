import type { AppDatabase } from '../../shared/db.js';
import type { WhatsappDestino } from './whatsapp.types.js';

type Row = {
  id: number;
  numero: string;
  created_at: string;
};

export class WhatsappDestinosRepository {
  constructor(private readonly db: AppDatabase) {}

  listar(): WhatsappDestino[] {
    const rows = this.db
      .prepare(
        `
        SELECT id, numero, created_at
        FROM whatsapp_destinos
        ORDER BY id ASC
        `,
      )
      .all() as Row[];
    return rows.map((r) => ({ id: r.id, numero: r.numero, created_at: r.created_at }));
  }

  listarNumeros(): string[] {
    return this.listar().map((d) => d.numero);
  }

  count(): number {
    return (this.db.prepare(`SELECT COUNT(*) AS n FROM whatsapp_destinos`).get() as { n: number })
      .n;
  }

  create(numero: string): WhatsappDestino {
    const result = this.db
      .prepare(`INSERT INTO whatsapp_destinos (numero) VALUES (?)`)
      .run(numero);
    const row = this.db
      .prepare(`SELECT id, numero, created_at FROM whatsapp_destinos WHERE id = ?`)
      .get(Number(result.lastInsertRowid)) as Row;
    return { id: row.id, numero: row.numero, created_at: row.created_at };
  }

  delete(id: number): boolean {
    const result = this.db.prepare(`DELETE FROM whatsapp_destinos WHERE id = ?`).run(id);
    return result.changes > 0;
  }

  /** Inserta WHATSAPP_TARGET_NUMBER si la tabla está vacía. */
  seedFromEnvIfEmpty(): void {
    if (this.count() > 0) {
      return;
    }
    const target = process.env.WHATSAPP_TARGET_NUMBER?.trim();
    if (!target) {
      return;
    }
    this.db.prepare(`INSERT INTO whatsapp_destinos (numero) VALUES (?)`).run(target);
  }
}
