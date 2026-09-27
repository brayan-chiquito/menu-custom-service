import type { AuditoriaEntry } from '../../shared/api/authTypes';
import { formatHoraBogota, parseCreatedAt } from '../historial/historial.format';

const MESES = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

function formatFechaCorta(createdAt: string): string {
  const date = parseCreatedAt(createdAt);
  if (!date) return createdAt;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Bogota',
    day: 'numeric',
    month: 'numeric',
  }).formatToParts(date);
  const day = parts.find((p) => p.type === 'day')?.value ?? '';
  const month = Number(parts.find((p) => p.type === 'month')?.value ?? '1');
  const hora = formatHoraBogota(createdAt);
  return `${day} ${MESES[month - 1]} · ${hora}`;
}

/** Quién · acción · entidad [#id] */
export function formatearFilaAuditoria(entry: AuditoriaEntry): {
  quien: string;
  que: string;
  cuando: string;
} {
  const quien = entry.nombre?.trim() || entry.usuario?.trim() || 'Sistema';
  const entidadParte = entry.entidad_id
    ? `${entry.entidad} #${entry.entidad_id}`
    : entry.entidad;
  const que = `${entry.accion} · ${entidadParte}`;
  return {
    quien,
    que,
    cuando: formatFechaCorta(entry.created_at),
  };
}
