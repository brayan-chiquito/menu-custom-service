import { CocinaRepository } from './cocina.repository.js';
import type { CocinaPedido } from './cocina.types.js';

export class CocinaService {
  constructor(private readonly repository: CocinaRepository) {}

  listarCola(): CocinaPedido[] {
    return this.repository.listarColaHoy();
  }
}
