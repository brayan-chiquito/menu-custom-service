import type { Request, Response } from 'express';
import { AppError } from '../../shared/errors.js';
import { clearSessionCookie, setSessionCookie } from '../../shared/sessionCookie.js';
import { AuthService } from './auth.service.js';
import type { LoginInput } from './auth.types.js';

export class AuthController {
  constructor(private readonly service: AuthService) {}

  login(req: Request, res: Response): void {
    const body = req.body as Partial<LoginInput>;
    if (!body || typeof body !== 'object') {
      throw new AppError('Body inválido', 400);
    }
    const ip =
      (typeof req.headers['x-forwarded-for'] === 'string'
        ? req.headers['x-forwarded-for'].split(',')[0]?.trim()
        : null) ||
      req.socket.remoteAddress ||
      'unknown';
    const result = this.service.login(
      {
        usuario: body.usuario as string,
        password: body.password as string,
      },
      ip,
    );
    setSessionCookie(res, result.token);
    res.status(200).json(result);
  }

  logout(req: Request, res: Response): void {
    const token = req.token;
    if (!token) {
      throw new AppError('No autorizado', 401);
    }
    this.service.logout(token, req.usuario?.id);
    clearSessionCookie(res);
    res.status(204).send();
  }

  me(req: Request, res: Response): void {
    if (!req.usuario) {
      throw new AppError('No autorizado', 401);
    }
    res.status(200).json(this.service.me(req.usuario.id));
  }
}
