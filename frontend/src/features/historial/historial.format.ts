import type { PedidoDetalleLinea } from '../../shared/api/types';

export function formatearLineaDetalle(linea: PedidoDetalleLinea): string {
  const partes: string[] = [];
  if (linea.base_nombre) {
    partes.push(linea.base_nombre);
  }
  if (linea.salsa_nombres.length > 0) {
    partes.push(linea.salsa_nombres.join(', '));
  }
  if (linea.proteina_nombre) {
    partes.push(linea.proteina_nombre);
  }
  if (linea.adiciones.length > 0) {
    partes.push(linea.adiciones.map((a) => a.nombre).join(', '));
  }
  return partes.join(' · ');
}

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

/** Interpreta created_at SQLite (UTC) como Date. */
export function parseCreatedAt(createdAt: string): Date | null {
  const date = new Date(createdAt.includes('T') ? createdAt : `${createdAt.replace(' ', 'T')}Z`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

export function formatHoraBogota(createdAt: string): string {
  const date = parseCreatedAt(createdAt);
  if (!date) {
    return createdAt;
  }
  return date.toLocaleTimeString('es-CO', {
    timeZone: 'America/Bogota',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ymdBogota(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(date);
}

/** Meta de card: `#id · hora` si es hoy Bogotá; si no `#id · 19 sep · hora`. */
export function formatearMetaHistorial(id: number, createdAt: string, ahora = new Date()): string {
  const date = parseCreatedAt(createdAt);
  if (!date) {
    return `#${id}`;
  }

  const hora = formatHoraBogota(createdAt);
  const diaPedido = ymdBogota(date);
  const diaHoy = ymdBogota(ahora);

  if (diaPedido === diaHoy) {
    return `#${id} · ${hora}`;
  }

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Bogota',
    day: 'numeric',
    month: 'numeric',
  }).formatToParts(date);
  const day = parts.find((p) => p.type === 'day')?.value ?? '';
  const month = Number(parts.find((p) => p.type === 'month')?.value ?? '1');
  return `#${id} · ${day} ${MESES[month - 1]} · ${hora}`;
}
