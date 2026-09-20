import type { Request, Response } from 'express';
import { AppError } from '../../shared/errors.js';
import { PedidosService } from './pedidos.service.js';
import type { CrearPedidoInput, RegistrarPagoInput } from './pedidos.types.js';

export class PedidosController {
  constructor(private readonly service: PedidosService) {}

  listar(req: Request, res: Response): void {
    const fecha = typeof req.query.fecha === 'string' ? req.query.fecha : undefined;
    const pedidos = this.service.listarPorFecha(fecha);
    res.status(200).json(pedidos);
  }

  balance(req: Request, res: Response): void {
    const periodo = typeof req.query.periodo === 'string' ? req.query.periodo : undefined;
    const balance = this.service.obtenerBalance(periodo);
    res.status(200).json(balance);
  }

  obtener(req: Request, res: Response): void {
    const id = Number(req.params.id);
    const pedido = this.service.obtenerPorId(id);
    res.status(200).json(pedido);
  }

  crear(req: Request, res: Response): void {
    const body = req.body as Partial<CrearPedidoInput>;

    if (!body || typeof body !== 'object') {
      throw new AppError('Body inválido', 400);
    }

    const pedido = this.service.crear({
      nombre_cliente: body.nombre_cliente,
      items: Array.isArray(body.items) ? body.items : [],
    });

    res.status(201).json(pedido);
  }

  registrarPago(req: Request, res: Response): void {
    const id = Number(req.params.id);
    const body = req.body as Partial<RegistrarPagoInput>;

    if (!body || typeof body !== 'object') {
      throw new AppError('Body inválido', 400);
    }

    const pedido = this.service.registrarPago(id, {
      monto_pagado: body.monto_pagado as number,
    });

    res.status(200).json(pedido);
  }

  async confirmar(req: Request, res: Response): Promise<void> {
    const id = Number(req.params.id);
    const pedido = await this.service.confirmar(id);
    res.status(200).json(pedido);
  }
}
