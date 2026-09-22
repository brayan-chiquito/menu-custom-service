import type { Request, Response } from 'express';
import { AppError } from '../../shared/errors.js';
import type { Egreso } from '../egresos/egresos.types.js';
import { PedidosService } from './pedidos.service.js';
import type {
  ActualizarPedidoInput,
  CrearPedidoInput,
  PeriodoBalance,
  RegistrarPagoInput,
} from './pedidos.types.js';

export class PedidosController {
  constructor(
    private readonly service: PedidosService,
    private readonly gastosPorPeriodo: (periodo: PeriodoBalance) => number = () => 0,
    private readonly egresosPorPeriodo: (periodo: PeriodoBalance) => Egreso[] = () => [],
  ) {}

  listar(req: Request, res: Response): void {
    const fecha = typeof req.query.fecha === 'string' ? req.query.fecha : undefined;
    const limit = typeof req.query.limit === 'string' ? req.query.limit : undefined;
    const offset = typeof req.query.offset === 'string' ? req.query.offset : undefined;
    const estado = typeof req.query.estado === 'string' ? req.query.estado : undefined;
    const eliminados =
      typeof req.query.eliminados === 'string' ? req.query.eliminados : undefined;

    const usaPaginacion =
      fecha === undefined ||
      limit !== undefined ||
      offset !== undefined ||
      estado !== undefined ||
      eliminados !== undefined;

    if (!usaPaginacion) {
      // Solo ?fecha=hoy → array legacy (día Bogotá)
      const pedidos = this.service.listarPorFecha(fecha);
      res.status(200).json(pedidos);
      return;
    }

    if (fecha !== undefined) {
      throw new AppError(
        'Para historial paginado omita fecha; use limit, offset y estado opcionales',
        400,
      );
    }

    const lista = this.service.listarPaginado({
      limitRaw: limit,
      offsetRaw: offset,
      estadoRaw: estado,
      eliminadosRaw: eliminados,
    });
    res.status(200).json(lista);
  }

  balance(req: Request, res: Response): void {
    const periodo = typeof req.query.periodo === 'string' ? req.query.periodo : undefined;
    if (periodo !== 'hoy' && periodo !== 'semana' && periodo !== 'mes') {
      throw new AppError('Parámetro periodo inválido; use hoy|semana|mes', 400);
    }
    const gastos = this.gastosPorPeriodo(periodo);
    const balance = this.service.obtenerBalance(periodo, gastos);
    res.status(200).json(balance);
  }

  async exportarBalance(req: Request, res: Response): Promise<void> {
    const periodo = typeof req.query.periodo === 'string' ? req.query.periodo : undefined;
    if (periodo !== 'hoy' && periodo !== 'semana' && periodo !== 'mes') {
      throw new AppError('Parámetro periodo inválido; use hoy|semana|mes', 400);
    }
    const gastos = this.gastosPorPeriodo(periodo);
    const egresos = this.egresosPorPeriodo(periodo);
    const file = await this.service.exportarBalance(periodo, gastos, egresos);
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.status(200).send(file.buffer);
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
      indicaciones: body.indicaciones,
      items: Array.isArray(body.items) ? body.items : [],
    });

    res.status(201).json(pedido);
  }

  actualizar(req: Request, res: Response): void {
    const id = Number(req.params.id);
    const body = req.body as Partial<ActualizarPedidoInput>;

    if (!body || typeof body !== 'object') {
      throw new AppError('Body inválido', 400);
    }

    const pedido = this.service.actualizar(id, {
      nombre_cliente: body.nombre_cliente,
      indicaciones: body.indicaciones,
      items: Array.isArray(body.items) ? body.items : undefined,
    });

    res.status(200).json(pedido);
  }

  restaurar(req: Request, res: Response): void {
    const id = Number(req.params.id);
    const pedido = this.service.restaurar(id);
    res.status(200).json(pedido);
  }

  eliminar(req: Request, res: Response): void {
    const id = Number(req.params.id);
    this.service.eliminar(id);
    res.status(204).send();
  }

  registrarPago(req: Request, res: Response): void {
    const id = Number(req.params.id);
    const body = req.body as Partial<RegistrarPagoInput>;

    if (!body || typeof body !== 'object') {
      throw new AppError('Body inválido', 400);
    }

    const pedido = this.service.registrarPago(id, {
      monto_pagado: body.monto_pagado as number,
      es_transferencia: body.es_transferencia === true,
    });

    res.status(200).json(pedido);
  }

  async confirmar(req: Request, res: Response): Promise<void> {
    const id = Number(req.params.id);
    const pedido = await this.service.confirmar(id);
    res.status(200).json(pedido);
  }
}
