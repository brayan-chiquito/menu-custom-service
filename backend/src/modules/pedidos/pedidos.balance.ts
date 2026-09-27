import type { PeriodoBalance } from './pedidos.types.js';
import { formatFechaBogota, getBogotaParts } from '../../shared/time.js';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** @deprecated usar formatFechaBogota — se mantiene alias para imports viejos en tests. */
export function formatFechaUtc(date: Date): string {
  return formatFechaBogota(date);
}

/**
 * Resuelve el rango inclusivo del periodo en America/Bogota.
 * Semana = lunes → hoy. Mes = día 1 → hoy.
 */
export function resolverRangoPeriodo(
  periodo: PeriodoBalance,
  ahora: Date = new Date(),
): { desde: string; hasta: string } {
  const hasta = formatFechaBogota(ahora);
  const parts = getBogotaParts(ahora);

  if (periodo === 'hoy') {
    return { desde: hasta, hasta };
  }

  if (periodo === 'mes') {
    const desde = `${parts.year}-${pad2(parts.month)}-01`;
    return { desde, hasta };
  }

  const daysFromMonday = parts.weekday === 0 ? 6 : parts.weekday - 1;
  const mondayUtc = Date.UTC(parts.year, parts.month - 1, parts.day);
  const monday = new Date(mondayUtc);
  monday.setUTCDate(monday.getUTCDate() - daysFromMonday);
  const desde = `${monday.getUTCFullYear()}-${pad2(monday.getUTCMonth() + 1)}-${pad2(monday.getUTCDate())}`;
  return { desde, hasta };
}

export function calcularTicketPromedio(cobrado: number, pedidosPagados: number): number {
  if (pedidosPagados <= 0) {
    return 0;
  }
  return Math.round(cobrado / pedidosPagados);
}
