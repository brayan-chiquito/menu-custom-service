import { describe, expect, it } from 'vitest';
import { esBalanceVacio, formatearRangoBalance } from './balance.format';

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
    expect(esBalanceVacio({ pedidos_pagados: 0, pedidos_pendientes: 0 })).toBe(true);
    expect(esBalanceVacio({ pedidos_pagados: 0, pedidos_pendientes: 1 })).toBe(false);
  });
});
