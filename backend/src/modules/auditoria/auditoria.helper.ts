import type { AppDatabase } from '../../shared/db.js';

export type RegistrarAuditoriaInput = {
  usuarioId?: number | null;
  accion: string;
  entidad: string;
  entidadId?: string | number | null;
  detalle?: string | null;
};

export function registrarAuditoria(db: AppDatabase, input: RegistrarAuditoriaInput): void {
  const entidadId =
    input.entidadId === undefined || input.entidadId === null
      ? null
      : String(input.entidadId);

  db.prepare(
    `
    INSERT INTO auditoria (usuario_id, accion, entidad, entidad_id, detalle)
    VALUES (?, ?, ?, ?, ?)
    `,
  ).run(
    input.usuarioId ?? null,
    input.accion,
    input.entidad,
    entidadId,
    input.detalle ?? null,
  );
}
