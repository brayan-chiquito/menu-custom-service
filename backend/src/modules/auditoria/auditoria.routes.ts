import { Router, type NextFunction, type Request, type Response } from 'express';
import type { AuditoriaController } from './auditoria.controller.js';

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

export function createAuditoriaRouter(controller: AuditoriaController): Router {
  const router = Router();
  router.get('/', wrap((req, res) => controller.listar(req, res)));
  return router;
}
