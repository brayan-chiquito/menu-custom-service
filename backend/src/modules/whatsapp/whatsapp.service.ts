import type { AppDatabase } from '../../shared/db.js';
import { AppError } from '../../shared/errors.js';
import { registrarAuditoria } from '../auditoria/auditoria.helper.js';
import type { Notificador } from '../notificaciones/notificador.interface.js';
import { WhatsappDestinosRepository } from './whatsapp.repository.js';
import type { CrearDestinoInput, WhatsappDestino, WhatsappEstado } from './whatsapp.types.js';

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

export class WhatsappService {
  constructor(
    private readonly repository: WhatsappDestinosRepository,
    private readonly notificador: Notificador,
    private readonly db: AppDatabase,
  ) {}

  estado(): WhatsappEstado {
    if (typeof this.notificador.getEstado === 'function') {
      return this.notificador.getEstado();
    }
    return { activa: false, qr: null };
  }

  listarDestinos(): WhatsappDestino[] {
    return this.repository.listar();
  }

  crearDestino(input: CrearDestinoInput, actorId?: number): WhatsappDestino {
    const numero = normalizarNumero(input.numero);
    if (!numero) {
      throw new AppError('numero es obligatorio', 400);
    }
    try {
      const creado = this.repository.create(numero);
      registrarAuditoria(this.db, {
        usuarioId: actorId,
        accion: 'crear',
        entidad: 'whatsapp_destino',
        entidadId: creado.id,
        detalle: creado.numero,
      });
      return creado;
    } catch (error) {
      if (isUniqueConstraint(error)) {
        throw new AppError('Ese número ya está registrado', 409);
      }
      throw error;
    }
  }

  eliminarDestino(id: number, actorId?: number): void {
    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError('id inválido', 400);
    }
    const ok = this.repository.delete(id);
    if (!ok) {
      throw new AppError('Destino no encontrado', 404);
    }
    registrarAuditoria(this.db, {
      usuarioId: actorId,
      accion: 'eliminar',
      entidad: 'whatsapp_destino',
      entidadId: id,
    });
  }
}

/** Solo dígitos; mínimo razonable para Colombia/internacional. */
export function normalizarNumero(raw: string | undefined | null): string {
  if (typeof raw !== 'string') {
    return '';
  }
  return raw.replace(/\D/g, '');
}
