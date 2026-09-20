import type { Request, Response } from 'express';
import { ProductosService } from './productos.service.js';

export class ProductosController {
  constructor(private readonly service: ProductosService) {}

  obtenerMenu(_req: Request, res: Response): void {
    const menu = this.service.obtenerMenu();
    res.status(200).json(menu);
  }
}
