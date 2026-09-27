import { Router, type NextFunction, type Request, type Response } from 'express';
import type { AuthController } from './auth.controller.js';
import type { AuthMiddleware } from '../../shared/middlewares/auth.middleware.js';

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

export function createAuthRouter(
  controller: AuthController,
  auth: AuthMiddleware,
): Router {
  const router = Router();

  router.post('/login', wrap((req, res) => controller.login(req, res)));
  router.post('/logout', auth.requireAuth, wrap((req, res) => controller.logout(req, res)));
  router.get('/me', auth.requireAuth, wrap((req, res) => controller.me(req, res)));

  return router;
}
