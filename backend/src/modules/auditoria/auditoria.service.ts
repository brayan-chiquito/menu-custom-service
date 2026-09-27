import { AppError } from '../../shared/errors.js';
import { AuditoriaRepository } from './auditoria.repository.js';
import type { ListaAuditoriaResponse } from './auditoria.types.js';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export class AuditoriaService {
  constructor(private readonly repository: AuditoriaRepository) {}

  listar(limitRaw: string | undefined, offsetRaw: string | undefined): ListaAuditoriaResponse {
    const limit = this.parseLimit(limitRaw);
    const offset = this.parseOffset(offsetRaw);
    const { items, total } = this.repository.listar(limit, offset);
    return { items, total, limit, offset };
  }

  private parseLimit(raw: string | undefined): number {
    if (raw === undefined || raw === '') {
      return DEFAULT_LIMIT;
    }
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 1) {
      throw new AppError('limit debe ser un entero ≥ 1', 400);
    }
    return Math.min(n, MAX_LIMIT);
  }

  private parseOffset(raw: string | undefined): number {
    if (raw === undefined || raw === '') {
      return 0;
    }
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 0) {
      throw new AppError('offset debe ser un entero ≥ 0', 400);
    }
    return n;
  }
}
