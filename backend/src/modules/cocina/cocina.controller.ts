import type { Request, Response } from 'express';
import { subscribeCocina } from '../../shared/cocina-events.js';
import { AppError } from '../../shared/errors.js';
import { issueStreamTicket } from '../../shared/streamTicket.js';
import { CocinaService } from './cocina.service.js';

export class CocinaController {
  constructor(private readonly service: CocinaService) {}

  listar(_req: Request, res: Response): void {
    res.status(200).json(this.service.listarCola());
  }

  /** Emite ticket corto para EventSource (Bearer ya validado). */
  streamTicket(req: Request, res: Response): void {
    if (!req.usuario) {
      throw new AppError('No autorizado', 401);
    }
    res.status(200).json(issueStreamTicket(req.usuario));
  }

  stream(_req: Request, res: Response): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    subscribeCocina(res);
    res.write(`data: ${JSON.stringify({ type: 'refresh' })}\n\n`);

    const heartbeat = setInterval(() => {
      try {
        res.write(': heartbeat\n\n');
      } catch {
        clearInterval(heartbeat);
      }
    }, 25_000);

    res.on('close', () => {
      clearInterval(heartbeat);
    });
  }
}

export { emitCocinaRefresh } from '../../shared/cocina-events.js';
