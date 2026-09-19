import { Router } from 'express';
import type { PedidosController } from './pedidos.controller.js';

export function createPedidosRouter(controller: PedidosController): Router {
  const router = Router();

  router.get('/', (req, res, next) => {
    try {
      controller.listar(req, res);
    } catch (error) {
      next(error);
    }
  });

  router.get('/balance', (req, res, next) => {
    try {
      controller.balance(req, res);
    } catch (error) {
      next(error);
    }
  });

  router.get('/:id', (req, res, next) => {
    try {
      controller.obtener(req, res);
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

  router.patch('/:id/pago', (req, res, next) => {
    try {
      controller.registrarPago(req, res);
    } catch (error) {
      next(error);
    }
  });

  router.patch('/:id/confirmar', (req, res, next) => {
    void controller.confirmar(req, res).catch(next);
  });

  return router;
}
