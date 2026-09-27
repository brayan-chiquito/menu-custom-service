import { Router, type NextFunction, type Request, type Response } from 'express';
import type { AuthMiddleware } from '../../shared/middlewares/auth.middleware.js';
import type { CocinaController } from './cocina.controller.js';

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

/** Rutas de cocina que requieren sesión Bearer. */
export function createCocinaRouter(
  controller: CocinaController,
  auth: AuthMiddleware,
): Router {
  const router = Router();
  router.get('/', wrap((req, res) => controller.listar(req, res)));
  router.post(
    '/stream-ticket',
    auth.requireAuth,
    wrap((req, res) => controller.streamTicket(req, res)),
  );
  return router;
}

/** SSE montado fuera del requireAuth global; usa ticket corto. */
export function createCocinaStreamRouter(
  controller: CocinaController,
  auth: AuthMiddleware,
): Router {
  const router = Router();
  router.get(
    '/stream',
    auth.requireStreamTicket,
    (req, res) => {
      controller.stream(req, res);
    },
  );
  return router;
}
