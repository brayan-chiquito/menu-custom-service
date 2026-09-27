import type { Request, Response } from 'express';
import { AppError } from '../../shared/errors.js';
import { actorIdFrom } from '../../shared/middlewares/auth.middleware.js';
import { UsuariosService } from './usuarios.service.js';
import type { ActualizarUsuarioInput, CrearUsuarioInput } from './usuarios.types.js';

export class UsuariosController {
  constructor(private readonly service: UsuariosService) {}

  listar(_req: Request, res: Response): void {
    res.status(200).json(this.service.listar());
  }

  crear(req: Request, res: Response): void {
    const body = req.body as Partial<CrearUsuarioInput>;
    if (!body || typeof body !== 'object') {
      throw new AppError('Body inválido', 400);
    }
    const creado = this.service.crear(
      {
        usuario: body.usuario as string,
        nombre: body.nombre as string,
        rol: body.rol as CrearUsuarioInput['rol'],
        password: body.password as string,
      },
      actorIdFrom(req),
    );
    res.status(201).json(creado);
  }

  actualizar(req: Request, res: Response): void {
    const id = Number(req.params.id);
    const body = req.body as ActualizarUsuarioInput;
    if (!body || typeof body !== 'object') {
      throw new AppError('Body inválido', 400);
    }
    const actualizado = this.service.actualizar(id, body, actorIdFrom(req));
    res.status(200).json(actualizado);
  }

  revocarSesiones(req: Request, res: Response): void {
    const id = Number(req.params.id);
    const result = this.service.revocarSesiones(id, actorIdFrom(req));
    res.status(200).json(result);
  }
}
