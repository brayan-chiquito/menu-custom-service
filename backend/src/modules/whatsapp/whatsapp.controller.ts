import type { Request, Response } from 'express';
import { AppError } from '../../shared/errors.js';
import { actorIdFrom } from '../../shared/middlewares/auth.middleware.js';
import { WhatsappService } from './whatsapp.service.js';
import type { CrearDestinoInput } from './whatsapp.types.js';

export class WhatsappController {
  constructor(private readonly service: WhatsappService) {}

  estado(_req: Request, res: Response): void {
    res.status(200).json(this.service.estado());
  }

  listarDestinos(_req: Request, res: Response): void {
    res.status(200).json(this.service.listarDestinos());
  }

  crearDestino(req: Request, res: Response): void {
    const body = req.body as Partial<CrearDestinoInput>;
    if (!body || typeof body !== 'object') {
      throw new AppError('Body inválido', 400);
    }
    const creado = this.service.crearDestino(
      { numero: body.numero as string },
      actorIdFrom(req),
    );
    res.status(201).json(creado);
  }

  eliminarDestino(req: Request, res: Response): void {
    const id = Number(req.params.id);
    this.service.eliminarDestino(id, actorIdFrom(req));
    res.status(204).send();
  }
}
