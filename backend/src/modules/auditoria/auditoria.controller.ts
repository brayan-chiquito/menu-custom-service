import type { Request, Response } from 'express';
import { AuditoriaService } from './auditoria.service.js';

export class AuditoriaController {
  constructor(private readonly service: AuditoriaService) {}

  listar(req: Request, res: Response): void {
    const limit = typeof req.query.limit === 'string' ? req.query.limit : undefined;
    const offset = typeof req.query.offset === 'string' ? req.query.offset : undefined;
    res.status(200).json(this.service.listar(limit, offset));
  }
}
