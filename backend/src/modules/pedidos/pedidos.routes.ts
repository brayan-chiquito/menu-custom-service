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

  router.get('/balance/export', (req, res, next) => {
    void controller.exportarBalance(req, res).catch(next);
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

  router.patch('/:id/restaurar', (req, res, next) => {
    try {
      controller.restaurar(req, res);
    } catch (error) {
      next(error);
    }
  });

  router.patch('/:id', (req, res, next) => {
    try {
      controller.actualizar(req, res);
    } catch (error) {
      next(error);
    }
  });

  router.delete('/:id', (req, res, next) => {
    try {
      controller.eliminar(req, res);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
