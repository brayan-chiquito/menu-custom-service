import type { Request, RequestHandler } from 'express';
import { AppError } from '../errors.js';
import type { AuthService } from '../../modules/auth/auth.service.js';
import type { UsuarioPublico } from '../../modules/auth/auth.types.js';
import { readSessionCookie } from '../sessionCookie.js';
import { resolveStreamTicket } from '../streamTicket.js';

export type AuthMiddleware = {
  requireAuth: RequestHandler;
  requireAdmin: RequestHandler;
  optionalAuth: RequestHandler;
  /** Solo SSE: `?ticket=` de corta vida (no el token de sesión). */
  requireStreamTicket: RequestHandler;
};

declare global {
  namespace Express {
    interface Request {
      usuario?: UsuarioPublico;
      token?: string;
    }
  }
}

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (typeof header !== 'string') {
    return null;
  }
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1].trim() : null;
}

/** Bearer (Bruno/tests) o cookie httpOnly (navegador). */
function extractSessionToken(req: Request): string | null {
  return extractBearerToken(req) ?? readSessionCookie(req);
}

export function createAuthMiddleware(
  authService: AuthService,
  options: { requireAuth: boolean },
): AuthMiddleware {
  const optionalAuth: RequestHandler = (req, _res, next) => {
    const token = extractSessionToken(req);
    if (!token) {
      next();
      return;
    }
    try {
      const usuario = authService.resolveUsuarioFromToken(token);
      req.token = token;
      req.usuario = usuario;
    } catch {
      // token inválido: no adjuntar
    }
    next();
  };

  const requireAuthStrict: RequestHandler = (req, _res, next) => {
    try {
      const token = extractSessionToken(req);
      if (!token) {
        throw new AppError('No autorizado', 401);
      }
      const usuario = authService.resolveUsuarioFromToken(token);
      req.token = token;
      req.usuario = usuario;
      next();
    } catch (error) {
      next(error);
    }
  };

  const requireAdminStrict: RequestHandler = (req, res, next) => {
    const ensureAdmin = () => {
      if (!req.usuario || req.usuario.rol !== 'admin') {
        next(new AppError('Se requiere rol administrador', 403));
        return;
      }
      next();
    };

    if (req.usuario) {
      ensureAdmin();
      return;
    }

    requireAuthStrict(req, res, (err?: unknown) => {
      if (err) {
        next(err);
        return;
      }
      ensureAdmin();
    });
  };

  const requireStreamTicket: RequestHandler = (req, _res, next) => {
    try {
      const q = req.query.ticket;
      if (typeof q !== 'string' || q.trim() === '') {
        throw new AppError('No autorizado', 401);
      }
      req.usuario = resolveStreamTicket(q.trim());
      next();
    } catch (error) {
      next(error);
    }
  };

  if (!options.requireAuth) {
    return {
      requireAuth: optionalAuth,
      requireAdmin: optionalAuth,
      optionalAuth,
      requireStreamTicket: optionalAuth,
    };
  }

  return {
    requireAuth: requireAuthStrict,
    requireAdmin: requireAdminStrict,
    optionalAuth,
    requireStreamTicket,
  };
}

export function actorIdFrom(req: Request): number | undefined {
  return req.usuario?.id;
}
