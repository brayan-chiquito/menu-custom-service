import type { Request, Response } from 'express';
import { AppError } from '../../shared/errors.js';
import { ProductosService } from './productos.service.js';
import type {
  ActualizarAdicionInput,
  ActualizarProductoInput,
  CrearAdicionInput,
  CrearNombreInput,
  CrearProductoInput,
} from './productos.types.js';

type NombreTabla = 'bases' | 'salsas' | 'proteinas';

export class ProductosController {
  constructor(private readonly service: ProductosService) {}

  obtenerMenu(_req: Request, res: Response): void {
    const menu = this.service.obtenerMenu();
    res.status(200).json(menu);
  }

  listarProductos(_req: Request, res: Response): void {
    res.status(200).json(this.service.listarProductos());
  }

  obtenerProducto(req: Request, res: Response): void {
    const id = this.parseId(req.params.id);
    res.status(200).json(this.service.obtenerProducto(id));
  }

  crearProducto(req: Request, res: Response): void {
    const body = req.body as Partial<CrearProductoInput>;
    if (!body || typeof body !== 'object') {
      throw new AppError('Body inválido', 400);
    }
    const creado = this.service.crearProducto({
      nombre: body.nombre as string,
      descripcion: body.descripcion,
      precio: body.precio as number,
      categoria: body.categoria as 'platos' | 'bebidas',
      disponible: body.disponible,
      requiere_proteina: body.requiere_proteina,
    });
    res.status(201).json(creado);
  }

  actualizarProducto(req: Request, res: Response): void {
    const id = this.parseId(req.params.id);
    const body = req.body as ActualizarProductoInput;
    if (!body || typeof body !== 'object') {
      throw new AppError('Body inválido', 400);
    }
    res.status(200).json(this.service.actualizarProducto(id, body));
  }

  eliminarProducto(req: Request, res: Response): void {
    const id = this.parseId(req.params.id);
    this.service.eliminarProducto(id);
    res.status(204).send();
  }

  listarAdiciones(_req: Request, res: Response): void {
    res.status(200).json(this.service.listarAdiciones());
  }

  obtenerAdicion(req: Request, res: Response): void {
    const id = this.parseId(req.params.id);
    res.status(200).json(this.service.obtenerAdicion(id));
  }

  crearAdicion(req: Request, res: Response): void {
    const body = req.body as Partial<CrearAdicionInput>;
    if (!body || typeof body !== 'object') {
      throw new AppError('Body inválido', 400);
    }
    const creado = this.service.crearAdicion({
      nombre: body.nombre as string,
      precio: body.precio as number,
      producto_id: body.producto_id,
    });
    res.status(201).json(creado);
  }

  actualizarAdicion(req: Request, res: Response): void {
    const id = this.parseId(req.params.id);
    const body = req.body as ActualizarAdicionInput;
    if (!body || typeof body !== 'object') {
      throw new AppError('Body inválido', 400);
    }
    res.status(200).json(this.service.actualizarAdicion(id, body));
  }

  eliminarAdicion(req: Request, res: Response): void {
    const id = this.parseId(req.params.id);
    this.service.eliminarAdicion(id);
    res.status(204).send();
  }

  listarNombres(tabla: NombreTabla) {
    return (_req: Request, res: Response): void => {
      res.status(200).json(this.service.listarNombres(tabla));
    };
  }

  obtenerNombre(tabla: NombreTabla) {
    return (req: Request, res: Response): void => {
      const id = this.parseId(req.params.id);
      res.status(200).json(this.service.obtenerNombre(tabla, id));
    };
  }

  crearNombre(tabla: NombreTabla) {
    return (req: Request, res: Response): void => {
      const body = req.body as Partial<CrearNombreInput>;
      if (!body || typeof body !== 'object') {
        throw new AppError('Body inválido', 400);
      }
      const creado = this.service.crearNombre(tabla, { nombre: body.nombre as string });
      res.status(201).json(creado);
    };
  }

  actualizarNombre(tabla: NombreTabla) {
    return (req: Request, res: Response): void => {
      const id = this.parseId(req.params.id);
      const body = req.body as Partial<CrearNombreInput>;
      if (!body || typeof body !== 'object') {
        throw new AppError('Body inválido', 400);
      }
      res.status(200).json(this.service.actualizarNombre(tabla, id, { nombre: body.nombre as string }));
    };
  }

  eliminarNombre(tabla: NombreTabla) {
    return (req: Request, res: Response): void => {
      const id = this.parseId(req.params.id);
      this.service.eliminarNombre(tabla, id);
      res.status(204).send();
    };
  }

  private parseId(raw: string): number {
    const id = Number(raw);
    if (!Number.isInteger(id) || id < 1) {
      throw new AppError('id inválido', 400);
    }
    return id;
  }
}
