import { Router } from 'express';
import type { ProductosController } from './productos.controller.js';

export function createProductosRouter(controller: ProductosController): Router {
  const router = Router();

  router.get('/', (req, res, next) => {
    try {
      controller.obtenerMenu(req, res);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
