import { AppError } from '../../shared/errors.js';
import { resolverRangoPeriodo } from '../pedidos/pedidos.balance.js';
import type { PeriodoBalance } from '../pedidos/pedidos.types.js';
import { EgresosRepository } from './egresos.repository.js';
import type { CrearEgresoInput, Egreso } from './egresos.types.js';

export class EgresosService {
  constructor(private readonly repository: EgresosRepository) {}

  crear(input: CrearEgresoInput): Egreso {
    const nombre = typeof input.nombre === 'string' ? input.nombre.trim() : '';
    if (nombre === '') {
      throw new AppError('nombre es obligatorio', 400);
    }
    if (typeof input.precio !== 'number' || Number.isNaN(input.precio) || input.precio < 0) {
      throw new AppError('precio debe ser un número ≥ 0', 400);
    }
    if (typeof input.cantidad !== 'number' || Number.isNaN(input.cantidad) || input.cantidad <= 0) {
      throw new AppError('cantidad debe ser un número > 0', 400);
    }

    const total = Math.round(input.precio * input.cantidad);
    return this.repository.create({
      nombre,
      precio: input.precio,
      cantidad: input.cantidad,
      total,
    });
  }

  listarPorPeriodo(periodoRaw: string | undefined): Egreso[] {
    if (periodoRaw !== 'hoy' && periodoRaw !== 'semana' && periodoRaw !== 'mes') {
      throw new AppError('Parámetro periodo inválido; use hoy|semana|mes', 400);
    }
    const { desde, hasta } = resolverRangoPeriodo(periodoRaw as PeriodoBalance);
    return this.repository.findEntreFechas(desde, hasta);
  }
}
