import { ProductosRepository } from './productos.repository.js';
import type { MenuResponse } from './productos.types.js';

export class ProductosService {
  constructor(private readonly repository: ProductosRepository) {}

  obtenerMenu(): MenuResponse {
    return this.repository.findMenu();
  }
}
