import type { Request, Response } from 'express';
import { AppError } from '../../shared/errors.js';
import { EgresosService } from './egresos.service.js';
import type { CrearEgresoInput } from './egresos.types.js';

export class EgresosController {
  constructor(private readonly service: EgresosService) {}

  crear(req: Request, res: Response): void {
    const body = req.body as Partial<CrearEgresoInput>;
    if (!body || typeof body !== 'object') {
      throw new AppError('Body inválido', 400);
    }
    const egreso = this.service.crear({
      nombre: body.nombre as string,
      precio: body.precio as number,
      cantidad: body.cantidad as number,
    });
    res.status(201).json(egreso);
  }

  listar(req: Request, res: Response): void {
    const periodo = typeof req.query.periodo === 'string' ? req.query.periodo : undefined;
    const egresos = this.service.listarPorPeriodo(periodo);
    res.status(200).json(egresos);
  }
}
