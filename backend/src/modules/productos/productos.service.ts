import { AppError } from '../../shared/errors.js';
import type { AppDatabase } from '../../shared/db.js';
import { registrarAuditoria } from '../auditoria/auditoria.helper.js';
import { ProductosRepository } from './productos.repository.js';
import type {
  ActualizarAdicionInput,
  ActualizarProductoInput,
  Adicion,
  CrearAdicionInput,
  CrearNombreInput,
  CrearProductoInput,
  MenuResponse,
  Producto,
} from './productos.types.js';

type NombreTabla = 'bases' | 'salsas' | 'proteinas';

function isUniqueConstraint(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const err = error as { code?: string; message?: string };
  return (
    err.code === 'SQLITE_CONSTRAINT_UNIQUE' ||
    err.code === 'SQLITE_CONSTRAINT' ||
    (typeof err.message === 'string' && err.message.includes('UNIQUE'))
  );
}

export class ProductosService {
  constructor(
    private readonly repository: ProductosRepository,
    private readonly db: AppDatabase,
  ) {}

  obtenerMenu(): MenuResponse {
    return this.repository.findMenu();
  }

  listarProductos(): Producto[] {
    return this.repository.listProductosAdmin();
  }

  obtenerProducto(id: number): Producto {
    const producto = this.repository.findProductoById(id);
    if (!producto) {
      throw new AppError('Producto no encontrado', 404);
    }
    return producto;
  }

  crearProducto(input: CrearProductoInput, actorId?: number): Producto {
    const data = this.validarProductoInput(input, true);
    try {
      const creado = this.repository.createProducto(data);
      registrarAuditoria(this.db, {
        usuarioId: actorId,
        accion: 'crear',
        entidad: 'producto',
        entidadId: creado.id,
        detalle: creado.nombre,
      });
      return creado;
    } catch (error) {
      if (isUniqueConstraint(error)) {
        throw new AppError('Ya existe un producto con ese nombre', 409);
      }
      throw error;
    }
  }

  actualizarProducto(id: number, input: ActualizarProductoInput, actorId?: number): Producto {
    const actual = this.obtenerProducto(id);
    const merged: CrearProductoInput = {
      nombre: input.nombre ?? actual.nombre,
      descripcion: input.descripcion ?? actual.descripcion,
      precio: input.precio ?? actual.precio,
      categoria: (input.categoria ?? actual.categoria) as 'platos' | 'bebidas',
      disponible: input.disponible ?? actual.disponible,
      requiere_proteina: input.requiere_proteina ?? actual.requiere_proteina,
    };
    const data = this.validarProductoInput(merged, true);
    try {
      const actualizado = this.repository.updateProducto(id, data);
      registrarAuditoria(this.db, {
        usuarioId: actorId,
        accion: 'actualizar',
        entidad: 'producto',
        entidadId: id,
        detalle: actualizado.nombre,
      });
      return actualizado;
    } catch (error) {
      if (isUniqueConstraint(error)) {
        throw new AppError('Ya existe un producto con ese nombre', 409);
      }
      throw error;
    }
  }

  eliminarProducto(id: number, actorId?: number): void {
    this.obtenerProducto(id);
    const refs = this.repository.countPedidoItemsByProducto(id);
    if (refs > 0) {
      throw new AppError(
        'No se puede eliminar: el producto está usado en pedidos históricos',
        409,
      );
    }
    this.repository.deleteProducto(id);
    registrarAuditoria(this.db, {
      usuarioId: actorId,
      accion: 'eliminar',
      entidad: 'producto',
      entidadId: id,
    });
  }

  listarAdiciones(): Adicion[] {
    return this.repository.listAdiciones();
  }

  obtenerAdicion(id: number): Adicion {
    const adicion = this.repository.findAdicionById(id);
    if (!adicion) {
      throw new AppError('Topping no encontrado', 404);
    }
    return adicion;
  }

  crearAdicion(input: CrearAdicionInput, actorId?: number): Adicion {
    const data = this.validarAdicionInput(input);
    try {
      const creado = this.repository.createAdicion(data);
      registrarAuditoria(this.db, {
        usuarioId: actorId,
        accion: 'crear',
        entidad: 'adicion',
        entidadId: creado.id,
        detalle: creado.nombre,
      });
      return creado;
    } catch (error) {
      if (isUniqueConstraint(error)) {
        throw new AppError('Ya existe un topping con ese nombre', 409);
      }
      throw error;
    }
  }

  actualizarAdicion(id: number, input: ActualizarAdicionInput, actorId?: number): Adicion {
    const actual = this.obtenerAdicion(id);
    const merged: CrearAdicionInput = {
      nombre: input.nombre ?? actual.nombre,
      precio: input.precio ?? actual.precio,
      producto_id:
        input.producto_id !== undefined ? input.producto_id : actual.producto_id,
    };
    const data = this.validarAdicionInput(merged);
    try {
      const actualizado = this.repository.updateAdicion(id, data);
      registrarAuditoria(this.db, {
        usuarioId: actorId,
        accion: 'actualizar',
        entidad: 'adicion',
        entidadId: id,
        detalle: actualizado.nombre,
      });
      return actualizado;
    } catch (error) {
      if (isUniqueConstraint(error)) {
        throw new AppError('Ya existe un topping con ese nombre', 409);
      }
      throw error;
    }
  }

  eliminarAdicion(id: number, actorId?: number): void {
    this.obtenerAdicion(id);
    const refs = this.repository.countPedidoItemAdiciones(id);
    if (refs > 0) {
      throw new AppError(
        'No se puede eliminar: el topping está usado en pedidos históricos',
        409,
      );
    }
    this.repository.deleteAdicion(id);
    registrarAuditoria(this.db, {
      usuarioId: actorId,
      accion: 'eliminar',
      entidad: 'adicion',
      entidadId: id,
    });
  }

  listarNombres(tabla: NombreTabla): Array<{ id: number; nombre: string }> {
    return this.repository.listNombres(tabla);
  }

  obtenerNombre(tabla: NombreTabla, id: number): { id: number; nombre: string } {
    const row = this.repository.findNombreById(tabla, id);
    if (!row) {
      throw new AppError(`${this.labelTabla(tabla)} no encontrado`, 404);
    }
    return row;
  }

  crearNombre(
    tabla: NombreTabla,
    input: CrearNombreInput,
    actorId?: number,
  ): { id: number; nombre: string } {
    const nombre = this.validarNombre(input.nombre);
    try {
      const creado = this.repository.createNombre(tabla, nombre);
      registrarAuditoria(this.db, {
        usuarioId: actorId,
        accion: 'crear',
        entidad: tabla,
        entidadId: creado.id,
        detalle: creado.nombre,
      });
      return creado;
    } catch (error) {
      if (isUniqueConstraint(error)) {
        throw new AppError(`Ya existe ${this.labelTabla(tabla)} con ese nombre`, 409);
      }
      throw error;
    }
  }

  actualizarNombre(
    tabla: NombreTabla,
    id: number,
    input: CrearNombreInput,
    actorId?: number,
  ): { id: number; nombre: string } {
    this.obtenerNombre(tabla, id);
    const nombre = this.validarNombre(input.nombre);
    try {
      const actualizado = this.repository.updateNombre(tabla, id, nombre);
      registrarAuditoria(this.db, {
        usuarioId: actorId,
        accion: 'actualizar',
        entidad: tabla,
        entidadId: id,
        detalle: actualizado.nombre,
      });
      return actualizado;
    } catch (error) {
      if (isUniqueConstraint(error)) {
        throw new AppError(`Ya existe ${this.labelTabla(tabla)} con ese nombre`, 409);
      }
      throw error;
    }
  }

  eliminarNombre(tabla: NombreTabla, id: number, actorId?: number): void {
    this.obtenerNombre(tabla, id);
    const refs = this.repository.countRefsNombre(tabla, id);
    if (refs > 0) {
      throw new AppError(
        `No se puede eliminar: ${this.labelTabla(tabla)} está usado en pedidos históricos`,
        409,
      );
    }
    this.repository.deleteNombre(tabla, id);
    registrarAuditoria(this.db, {
      usuarioId: actorId,
      accion: 'eliminar',
      entidad: tabla,
      entidadId: id,
    });
  }

  private labelTabla(tabla: NombreTabla): string {
    if (tabla === 'bases') return 'Base';
    if (tabla === 'salsas') return 'Salsa';
    return 'Proteína';
  }

  private validarNombre(raw: unknown): string {
    const nombre = typeof raw === 'string' ? raw.trim() : '';
    if (nombre === '') {
      throw new AppError('nombre es obligatorio', 400);
    }
    return nombre;
  }

  private validarProductoInput(input: CrearProductoInput, requireAll: boolean) {
    const nombre = this.validarNombre(input.nombre);
    const descripcion =
      typeof input.descripcion === 'string' ? input.descripcion.trim() : '';
    if (requireAll && typeof input.precio !== 'number') {
      throw new AppError('precio debe ser un número ≥ 0', 400);
    }
    if (typeof input.precio !== 'number' || Number.isNaN(input.precio) || input.precio < 0) {
      throw new AppError('precio debe ser un número ≥ 0', 400);
    }
    if (input.categoria !== 'platos' && input.categoria !== 'bebidas') {
      throw new AppError('categoria inválida; use platos|bebidas', 400);
    }
    // Bebidas nunca requieren proteína
    const requiereProteina =
      input.categoria === 'bebidas' ? false : input.requiere_proteina === true;
    return {
      nombre,
      descripcion,
      precio: input.precio,
      categoria: input.categoria,
      disponible: input.disponible !== false,
      requiere_proteina: requiereProteina,
    };
  }

  private validarAdicionInput(input: CrearAdicionInput) {
    const nombre = this.validarNombre(input.nombre);
    if (typeof input.precio !== 'number' || Number.isNaN(input.precio) || input.precio < 0) {
      throw new AppError('precio debe ser un número ≥ 0', 400);
    }
    let productoId: number | null = null;
    if (input.producto_id !== undefined && input.producto_id !== null) {
      if (!Number.isInteger(input.producto_id) || input.producto_id < 1) {
        throw new AppError('producto_id inválido', 400);
      }
      if (!this.repository.findProductoById(input.producto_id)) {
        throw new AppError('Producto no encontrado para el topping', 400);
      }
      productoId = input.producto_id;
    }
    return { nombre, precio: input.precio, producto_id: productoId };
  }
}
