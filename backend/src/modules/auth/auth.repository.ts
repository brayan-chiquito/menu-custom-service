import type { AppDatabase } from '../../shared/db.js';
import type { RolUsuario, Sesion, Usuario, UsuarioPublico } from './auth.types.js';

type UsuarioRow = {
  id: number;
  usuario: string;
  nombre: string;
  rol: RolUsuario;
  activo: number;
  password_hash: string;
  created_at: string;
};

type SesionRow = {
  id: number;
  token: string;
  usuario_id: number;
  created_at: string;
  last_seen_at: string;
};

export class AuthRepository {
  constructor(private readonly db: AppDatabase) {}

  findUsuarioByUsuario(usuario: string): Usuario | null {
    const row = this.db
      .prepare(
        `
        SELECT id, usuario, nombre, rol, activo, password_hash, created_at
        FROM usuarios
        WHERE usuario = ?
        `,
      )
      .get(usuario) as UsuarioRow | undefined;
    return row ? this.mapUsuario(row) : null;
  }

  findUsuarioById(id: number): Usuario | null {
    const row = this.db
      .prepare(
        `
        SELECT id, usuario, nombre, rol, activo, password_hash, created_at
        FROM usuarios
        WHERE id = ?
        `,
      )
      .get(id) as UsuarioRow | undefined;
    return row ? this.mapUsuario(row) : null;
  }

  countSesionesActivas(ttlHours: number): number {
    this.deleteExpiredSesiones(ttlHours);
    const row = this.db.prepare(`SELECT COUNT(*) AS n FROM sesiones`).get() as { n: number };
    return row.n;
  }

  /** Borra sesiones cuya última actividad supera el TTL (horas). */
  deleteExpiredSesiones(ttlHours: number): number {
    const hours = Number.isFinite(ttlHours) && ttlHours > 0 ? ttlHours : 24;
    const result = this.db
      .prepare(
        `
        DELETE FROM sesiones
        WHERE datetime(last_seen_at) < datetime('now', ?)
        `,
      )
      .run(`-${hours} hours`);
    return result.changes;
  }

  createSesion(token: string, usuarioId: number): Sesion {
    const result = this.db
      .prepare(
        `
        INSERT INTO sesiones (token, usuario_id)
        VALUES (?, ?)
        `,
      )
      .run(token, usuarioId);
    const sesion = this.findSesionByToken(token);
    if (!sesion) {
      throw new Error(`No se pudo leer la sesión recién creada #${result.lastInsertRowid}`);
    }
    return sesion;
  }

  findSesionByToken(token: string): Sesion | null {
    const row = this.db
      .prepare(
        `
        SELECT id, token, usuario_id, created_at, last_seen_at
        FROM sesiones
        WHERE token = ?
        `,
      )
      .get(token) as SesionRow | undefined;
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      token: row.token,
      usuario_id: row.usuario_id,
      created_at: row.created_at,
      last_seen_at: row.last_seen_at,
    };
  }

  touchSesion(token: string): void {
    this.db
      .prepare(`UPDATE sesiones SET last_seen_at = datetime('now') WHERE token = ?`)
      .run(token);
  }

  deleteSesionByToken(token: string): boolean {
    const result = this.db.prepare(`DELETE FROM sesiones WHERE token = ?`).run(token);
    return result.changes > 0;
  }

  toPublico(usuario: Usuario): UsuarioPublico {
    return {
      id: usuario.id,
      usuario: usuario.usuario,
      nombre: usuario.nombre,
      rol: usuario.rol,
    };
  }

  private mapUsuario(row: UsuarioRow): Usuario {
    return {
      id: row.id,
      usuario: row.usuario,
      nombre: row.nombre,
      rol: row.rol,
      activo: row.activo === 1,
      password_hash: row.password_hash,
      created_at: row.created_at,
    };
  }
}
