import { randomBytes } from 'node:crypto';
import type { AppDatabase } from '../../shared/db.js';
import { AppError } from '../../shared/errors.js';
import { assertLoginNotLocked, clearLoginFailures, recordLoginFailure } from '../../shared/loginRateLimit.js';
import { verifyPassword } from '../../shared/password.js';
import { registrarAuditoria } from '../auditoria/auditoria.helper.js';
import { AuthRepository } from './auth.repository.js';
import type { LoginInput, LoginResponse, UsuarioPublico } from './auth.types.js';

const MAX_SESIONES = 10;
const SESSION_TTL_HOURS = Number(process.env.SESSION_TTL_HOURS) || 24;

export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly db: AppDatabase,
  ) {}

  login(input: LoginInput, clientIp = 'unknown'): LoginResponse {
    assertLoginNotLocked(clientIp);

    const usuarioRaw = typeof input.usuario === 'string' ? input.usuario.trim() : '';
    const password = typeof input.password === 'string' ? input.password : '';

    if (usuarioRaw === '' || password === '') {
      throw new AppError('Usuario y contraseña son obligatorios', 400);
    }

    const usuario = this.repository.findUsuarioByUsuario(usuarioRaw);
    if (!usuario || !usuario.activo || !verifyPassword(password, usuario.password_hash)) {
      recordLoginFailure(clientIp);
      throw new AppError('Usuario o contraseña incorrectos', 401);
    }

    clearLoginFailures(clientIp);

    if (this.repository.countSesionesActivas(SESSION_TTL_HOURS) >= MAX_SESIONES) {
      throw new AppError('Ya hay 10 sesiones activas. Cierra una para entrar.', 403);
    }

    const token = randomBytes(32).toString('hex');
    this.repository.createSesion(token, usuario.id);

    registrarAuditoria(this.db, {
      usuarioId: usuario.id,
      accion: 'login',
      entidad: 'sesion',
      entidadId: usuario.id,
    });

    return {
      token,
      usuario: this.repository.toPublico(usuario),
      expires_in_hours: SESSION_TTL_HOURS,
    };
  }

  logout(token: string, usuarioId: number | undefined): void {
    this.repository.deleteSesionByToken(token);
    registrarAuditoria(this.db, {
      usuarioId: usuarioId ?? null,
      accion: 'logout',
      entidad: 'sesion',
      entidadId: usuarioId ?? null,
    });
  }

  me(usuarioId: number): UsuarioPublico {
    const usuario = this.repository.findUsuarioById(usuarioId);
    if (!usuario || !usuario.activo) {
      throw new AppError('Sesión inválida', 401);
    }
    return this.repository.toPublico(usuario);
  }

  resolveUsuarioFromToken(token: string): UsuarioPublico {
    this.repository.deleteExpiredSesiones(SESSION_TTL_HOURS);
    const sesion = this.repository.findSesionByToken(token);
    if (!sesion) {
      throw new AppError('No autorizado', 401);
    }
    const usuario = this.repository.findUsuarioById(sesion.usuario_id);
    if (!usuario || !usuario.activo) {
      throw new AppError('No autorizado', 401);
    }
    this.repository.touchSesion(token);
    return this.repository.toPublico(usuario);
  }
}
