import type { AppDatabase } from '../../shared/db.js';
import type { RolUsuario } from '../auth/auth.types.js';
import type { UsuarioAdmin } from './usuarios.types.js';

type Row = {
  id: number;
  usuario: string;
  nombre: string;
  rol: RolUsuario;
  activo: number;
  created_at: string;
};

export class UsuariosRepository {
  constructor(private readonly db: AppDatabase) {}

  listar(): UsuarioAdmin[] {
    const rows = this.db
      .prepare(
        `
        SELECT id, usuario, nombre, rol, activo, created_at
        FROM usuarios
        ORDER BY id ASC
        `,
      )
      .all() as Row[];
    return rows.map(this.map);
  }

  findById(id: number): UsuarioAdmin | null {
    const row = this.db
      .prepare(
        `
        SELECT id, usuario, nombre, rol, activo, created_at
        FROM usuarios
        WHERE id = ?
        `,
      )
      .get(id) as Row | undefined;
    return row ? this.map(row) : null;
  }

  create(data: {
    usuario: string;
    nombre: string;
    rol: RolUsuario;
    password_hash: string;
  }): UsuarioAdmin {
    const result = this.db
      .prepare(
        `
        INSERT INTO usuarios (usuario, nombre, rol, activo, password_hash)
        VALUES (?, ?, ?, 1, ?)
        `,
      )
      .run(data.usuario, data.nombre, data.rol, data.password_hash);
    const creado = this.findById(Number(result.lastInsertRowid));
    if (!creado) {
      throw new Error('No se pudo leer el usuario recién creado');
    }
    return creado;
  }

  update(
    id: number,
    data: {
      nombre: string;
      rol: RolUsuario;
      activo: boolean;
      password_hash?: string;
    },
  ): UsuarioAdmin {
    if (data.password_hash) {
      this.db
        .prepare(
          `
          UPDATE usuarios
          SET nombre = ?, rol = ?, activo = ?, password_hash = ?
          WHERE id = ?
          `,
        )
        .run(data.nombre, data.rol, data.activo ? 1 : 0, data.password_hash, id);
    } else {
      this.db
        .prepare(
          `
          UPDATE usuarios
          SET nombre = ?, rol = ?, activo = ?
          WHERE id = ?
          `,
        )
        .run(data.nombre, data.rol, data.activo ? 1 : 0, id);
    }
    const actualizado = this.findById(id);
    if (!actualizado) {
      throw new Error(`Usuario #${id} no encontrado tras actualizar`);
    }
    return actualizado;
  }

  deleteSesiones(usuarioId: number): number {
    const result = this.db.prepare(`DELETE FROM sesiones WHERE usuario_id = ?`).run(usuarioId);
    return result.changes;
  }

  private map(row: Row): UsuarioAdmin {
    return {
      id: row.id,
      usuario: row.usuario,
      nombre: row.nombre,
      rol: row.rol,
      activo: row.activo === 1,
      created_at: row.created_at,
    };
  }
}
