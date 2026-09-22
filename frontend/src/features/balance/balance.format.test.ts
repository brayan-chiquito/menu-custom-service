import { describe, expect, it } from 'vitest';
import {
  esBalanceVacio,
  formatearRangoBalance,
  nombreArchivoBalanceExport,
} from './balance.format';

describe('balance.format', () => {
  it('should format hoy as single day', () => {
    expect(
      formatearRangoBalance({ periodo: 'hoy', desde: '2026-09-19', hasta: '2026-09-19' }),
    ).toBe('19 sep 2026');
  });

  it('should format semana as day range', () => {
    expect(
      formatearRangoBalance({ periodo: 'semana', desde: '2026-09-14', hasta: '2026-09-19' }),
    ).toBe('14–19 sep 2026');
  });

  it('should format mes as month label', () => {
    expect(
      formatearRangoBalance({ periodo: 'mes', desde: '2026-09-01', hasta: '2026-09-19' }),
    ).toBe('sep 2026');
  });

  it('should detect empty balance', () => {
    expect(esBalanceVacio({ pedidos_pagados: 0, pedidos_pendientes: 0, gastos: 0 })).toBe(true);
    expect(esBalanceVacio({ pedidos_pagados: 0, pedidos_pendientes: 1, gastos: 0 })).toBe(false);
    expect(esBalanceVacio({ pedidos_pagados: 0, pedidos_pendientes: 0, gastos: 5000 })).toBe(false);
  });

  it('should build export filenames with dates', () => {
    expect(
      nombreArchivoBalanceExport({ periodo: 'hoy', desde: '2026-09-20', hasta: '2026-09-20' }),
    ).toBe('balance-platanopolis-hoy-2026-09-20.xlsx');
    expect(
      nombreArchivoBalanceExport({
        periodo: 'semana',
        desde: '2026-09-14',
        hasta: '2026-09-20',
      }),
    ).toBe('balance-platanopolis-semana-2026-09-14_al_2026-09-20.xlsx');
    expect(
      nombreArchivoBalanceExport({ periodo: 'mes', desde: '2026-09-01', hasta: '2026-09-20' }),
    ).toBe('balance-platanopolis-mes-2026-09.xlsx');
  });
});
