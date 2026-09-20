import type { PeriodoBalance } from './pedidos.types.js';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Fecha YYYY-MM-DD en UTC (alineado con SQLite date('now')). */
export function formatFechaUtc(date: Date): string {
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}

/**
 * Resuelve el rango inclusivo del periodo.
 * Semana = lunes → hoy (UTC). Mes = día 1 → hoy (UTC).
 */
export function resolverRangoPeriodo(
  periodo: PeriodoBalance,
  ahora: Date = new Date(),
): { desde: string; hasta: string } {
  const hasta = formatFechaUtc(ahora);

  if (periodo === 'hoy') {
    return { desde: hasta, hasta };
  }

  if (periodo === 'mes') {
    const desde = `${ahora.getUTCFullYear()}-${pad2(ahora.getUTCMonth() + 1)}-01`;
    return { desde, hasta };
  }

  const day = ahora.getUTCDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate()));
  monday.setUTCDate(monday.getUTCDate() - daysFromMonday);
  return { desde: formatFechaUtc(monday), hasta };
}

export function calcularTicketPromedio(cobrado: number, pedidosPagados: number): number {
  if (pedidosPagados <= 0) {
    return 0;
  }
  return Math.round(cobrado / pedidosPagados);
}
