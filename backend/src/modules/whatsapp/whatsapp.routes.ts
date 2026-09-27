import { Router, type NextFunction, type Request, type Response } from 'express';
import type { WhatsappController } from './whatsapp.controller.js';

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

export function createWhatsappRouter(controller: WhatsappController): Router {
  const router = Router();
  router.get('/estado', wrap((req, res) => controller.estado(req, res)));
  router.get('/destinos', wrap((req, res) => controller.listarDestinos(req, res)));
  router.post('/destinos', wrap((req, res) => controller.crearDestino(req, res)));
  router.delete('/destinos/:id', wrap((req, res) => controller.eliminarDestino(req, res)));
  return router;
}
