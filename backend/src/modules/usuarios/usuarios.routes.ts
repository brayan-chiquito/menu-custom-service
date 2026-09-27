import { Router, type NextFunction, type Request, type Response } from 'express';
import type { AuthMiddleware } from '../../shared/middlewares/auth.middleware.js';
import type { UsuariosController } from './usuarios.controller.js';

function wrap(
  handler: (req: Request, res: Response) => void,
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    try {
      handler(req, res);
    } catch (error) {
      next(error);
    }
  };
}

export function createUsuariosRouter(
  controller: UsuariosController,
  auth: AuthMiddleware,
): Router {
  const router = Router();
  router.use(auth.requireAdmin);
  router.get('/', wrap((req, res) => controller.listar(req, res)));
  router.post('/', wrap((req, res) => controller.crear(req, res)));
  router.patch('/:id', wrap((req, res) => controller.actualizar(req, res)));
  router.delete('/:id/sesiones', wrap((req, res) => controller.revocarSesiones(req, res)));
  return router;
}
