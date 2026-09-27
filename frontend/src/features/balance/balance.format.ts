import type { BalanceVentas } from '../../shared/api/types';

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

function parseYmd(ymd: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!match) {
    return null;
  }
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
}

function fmtDia(ymd: string): string {
  const p = parseYmd(ymd);
  if (!p) {
    return ymd;
  }
  return `${p.d} ${MESES[p.m - 1]} ${p.y}`;
}

/** Texto de rango bajo los chips (UX 06). */
export function formatearRangoBalance(balance: Pick<BalanceVentas, 'periodo' | 'desde' | 'hasta'>): string {
  if (balance.periodo === 'hoy' || balance.desde === balance.hasta) {
    return fmtDia(balance.desde);
  }

  const a = parseYmd(balance.desde);
  const b = parseYmd(balance.hasta);
  if (!a || !b) {
    return `${balance.desde} – ${balance.hasta}`;
  }

  if (balance.periodo === 'mes' && a.d === 1) {
    return `${MESES[a.m - 1]} ${a.y}`;
  }

  if (a.y === b.y && a.m === b.m) {
    return `${a.d}–${b.d} ${MESES[a.m - 1]} ${a.y}`;
  }

  return `${fmtDia(balance.desde)} – ${fmtDia(balance.hasta)}`;
}

export function esBalanceVacio(
  balance: Pick<BalanceVentas, 'pedidos_pagados' | 'pedidos_pendientes' | 'gastos'>,
): boolean {
  return balance.pedidos_pagados === 0 && balance.pedidos_pendientes === 0 && balance.gastos === 0;
}

/** Nombre sugerido al guardar el .xlsx (misma regla que el backend). */
export function nombreArchivoBalanceExport(
  balance: Pick<BalanceVentas, 'periodo' | 'desde' | 'hasta'>,
): string {
  const { periodo, desde, hasta } = balance;
  if (periodo === 'hoy') {
    return `balance-platanopolis-hoy-${desde}.xlsx`;
  }
  if (periodo === 'semana') {
    return `balance-platanopolis-semana-${desde}_al_${hasta}.xlsx`;
  }
  return `balance-platanopolis-mes-${desde.slice(0, 7)}.xlsx`;
}
