import { Router } from 'express';
import type { EgresosController } from './egresos.controller.js';

export function createEgresosRouter(controller: EgresosController): Router {
  const router = Router();

  router.get('/', (req, res, next) => {
    try {
      controller.listar(req, res);
    } catch (error) {
      next(error);
    }
  });

  router.post('/', (req, res, next) => {
    try {
      controller.crear(req, res);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
