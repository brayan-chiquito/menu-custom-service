import type { AppDatabase } from '../../shared/db.js';
import { AppError } from '../../shared/errors.js';
import { hashPassword } from '../../shared/password.js';
import { validarPasswordPolitica } from '../../shared/passwordPolicy.js';
import { registrarAuditoria } from '../auditoria/auditoria.helper.js';
import type { RolUsuario } from '../auth/auth.types.js';
import { UsuariosRepository } from './usuarios.repository.js';
import type {
  ActualizarUsuarioInput,
  CrearUsuarioInput,
  UsuarioAdmin,
} from './usuarios.types.js';

function isUniqueConstraint(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const err = error as { code?: string; message?: string };
  return (
    err.code === 'SQLITE_CONSTRAINT_UNIQUE' ||
    err.code === 'SQLITE_CONSTRAINT' ||
    (typeof err.message === 'string' && err.message.includes('UNIQUE'))
  );
}

export class UsuariosService {
  constructor(
    private readonly repository: UsuariosRepository,
    private readonly db: AppDatabase,
  ) {}

  listar(): UsuarioAdmin[] {
    return this.repository.listar();
  }

  crear(input: CrearUsuarioInput, actorId?: number): UsuarioAdmin {
    const usuario = typeof input.usuario === 'string' ? input.usuario.trim() : '';
    const nombre = typeof input.nombre === 'string' ? input.nombre.trim() : '';
    const password = typeof input.password === 'string' ? input.password : '';
    const rol = input.rol;

    if (usuario === '') {
      throw new AppError('usuario es obligatorio', 400);
    }
    if (nombre === '') {
      throw new AppError('nombre es obligatorio', 400);
    }
    const passwordError = validarPasswordPolitica(password);
    if (passwordError) {
      throw new AppError(passwordError, 400);
    }
    if (rol !== 'operador' && rol !== 'admin') {
      throw new AppError('rol inválido; use operador|admin', 400);
    }

    try {
      const creado = this.repository.create({
        usuario,
        nombre,
        rol,
        password_hash: hashPassword(password),
      });
      registrarAuditoria(this.db, {
        usuarioId: actorId,
        accion: 'crear',
        entidad: 'usuario',
        entidadId: creado.id,
        detalle: creado.usuario,
      });
      return creado;
    } catch (error) {
      if (isUniqueConstraint(error)) {
        throw new AppError('Ya existe un usuario con ese nombre de acceso', 409);
      }
      throw error;
    }
  }

  actualizar(id: number, input: ActualizarUsuarioInput, actorId?: number): UsuarioAdmin {
    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError('id de usuario inválido', 400);
    }
    const actual = this.repository.findById(id);
    if (!actual) {
      throw new AppError('Usuario no encontrado', 404);
    }

    const nombre =
      input.nombre !== undefined
        ? typeof input.nombre === 'string'
          ? input.nombre.trim()
          : ''
        : actual.nombre;
    if (nombre === '') {
      throw new AppError('nombre es obligatorio', 400);
    }

    const rol: RolUsuario = input.rol ?? actual.rol;
    if (rol !== 'operador' && rol !== 'admin') {
      throw new AppError('rol inválido; use operador|admin', 400);
    }

    const activo = input.activo ?? actual.activo;
    if (typeof activo !== 'boolean') {
      throw new AppError('activo debe ser boolean', 400);
    }

    let password_hash: string | undefined;
    if (input.password !== undefined) {
      if (typeof input.password !== 'string') {
        throw new AppError('password inválido', 400);
      }
      const passwordError = validarPasswordPolitica(input.password);
      if (passwordError) {
        throw new AppError(passwordError, 400);
      }
      password_hash = hashPassword(input.password);
    }

    const actualizado = this.repository.update(id, {
      nombre,
      rol,
      activo,
      password_hash,
    });

    if (password_hash) {
      this.repository.deleteSesiones(id);
    }

    registrarAuditoria(this.db, {
      usuarioId: actorId,
      accion: 'actualizar',
      entidad: 'usuario',
      entidadId: id,
      detalle: actualizado.usuario,
    });

    return actualizado;
  }

  revocarSesiones(id: number, actorId?: number): { revocadas: number } {
    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError('id de usuario inválido', 400);
    }
    const actual = this.repository.findById(id);
    if (!actual) {
      throw new AppError('Usuario no encontrado', 404);
    }
    const revocadas = this.repository.deleteSesiones(id);
    registrarAuditoria(this.db, {
      usuarioId: actorId,
      accion: 'revocar_sesiones',
      entidad: 'usuario',
      entidadId: id,
      detalle: actual.usuario,
    });
    return { revocadas };
  }
}
