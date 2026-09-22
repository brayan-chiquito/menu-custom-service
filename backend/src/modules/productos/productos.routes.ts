import { Router, type NextFunction, type Request, type Response } from 'express';
import type { ProductosController } from './productos.controller.js';

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

export function createProductosRouter(controller: ProductosController): Router {
  const router = Router();
  router.get('/', wrap((req, res) => controller.obtenerMenu(req, res)));
  return router;
}

export function createCatalogoRouter(controller: ProductosController): Router {
  const router = Router();

  router.get('/productos', wrap((req, res) => controller.listarProductos(req, res)));
  router.get('/productos/:id', wrap((req, res) => controller.obtenerProducto(req, res)));
  router.post('/productos', wrap((req, res) => controller.crearProducto(req, res)));
  router.patch('/productos/:id', wrap((req, res) => controller.actualizarProducto(req, res)));
  router.delete('/productos/:id', wrap((req, res) => controller.eliminarProducto(req, res)));

  router.get('/adiciones', wrap((req, res) => controller.listarAdiciones(req, res)));
  router.get('/adiciones/:id', wrap((req, res) => controller.obtenerAdicion(req, res)));
  router.post('/adiciones', wrap((req, res) => controller.crearAdicion(req, res)));
  router.patch('/adiciones/:id', wrap((req, res) => controller.actualizarAdicion(req, res)));
  router.delete('/adiciones/:id', wrap((req, res) => controller.eliminarAdicion(req, res)));

  for (const tabla of ['bases', 'salsas', 'proteinas'] as const) {
    router.get(`/${tabla}`, wrap(controller.listarNombres(tabla)));
    router.get(`/${tabla}/:id`, wrap(controller.obtenerNombre(tabla)));
    router.post(`/${tabla}`, wrap(controller.crearNombre(tabla)));
    router.patch(`/${tabla}/:id`, wrap(controller.actualizarNombre(tabla)));
    router.delete(`/${tabla}/:id`, wrap(controller.eliminarNombre(tabla)));
  }

  return router;
}
