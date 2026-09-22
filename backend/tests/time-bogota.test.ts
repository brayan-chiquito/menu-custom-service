import { describe, expect, it } from 'vitest';
import { formatFechaBogota, getBogotaParts } from '../src/shared/time.js';
import {
  calcularTicketPromedio,
  formatFechaUtc,
  resolverRangoPeriodo,
} from '../src/modules/pedidos/pedidos.balance.js';

describe('time Bogotá', () => {
  it('should format calendar day in America/Bogota', () => {
    // 20 sep 2026 04:30 UTC = 19 sep 2026 23:30 Bogotá
    const lateUtc = new Date(Date.UTC(2026, 8, 20, 4, 30, 0));
    expect(formatFechaBogota(lateUtc)).toBe('2026-09-19');
    expect(getBogotaParts(lateUtc).day).toBe(19);
  });
});

describe('pedidos.balance helpers (Bogotá)', () => {
  it('should resolve hoy as single Bogotá day', () => {
    const ahora = new Date(Date.UTC(2026, 8, 19, 17, 0, 0)); // 19 sep mediodía Bogotá
    expect(resolverRangoPeriodo('hoy', ahora)).toEqual({
      desde: '2026-09-19',
      hasta: '2026-09-19',
    });
    expect(formatFechaUtc(ahora)).toBe('2026-09-19');
  });

  it('should resolve semana as monday to today (Bogotá)', () => {
    const viernes = new Date(Date.UTC(2026, 8, 19, 17, 0, 0));
    expect(resolverRangoPeriodo('semana', viernes)).toEqual({
      desde: '2026-09-14',
      hasta: '2026-09-19',
    });

    const domingo = new Date(Date.UTC(2026, 8, 20, 17, 0, 0));
    expect(resolverRangoPeriodo('semana', domingo)).toEqual({
      desde: '2026-09-14',
      hasta: '2026-09-20',
    });
  });

  it('should resolve mes as first day to today', () => {
    const ahora = new Date(Date.UTC(2026, 8, 19, 17, 0, 0));
    expect(resolverRangoPeriodo('mes', ahora)).toEqual({
      desde: '2026-09-01',
      hasta: '2026-09-19',
    });
  });

  it('should compute ticket promedio rounded', () => {
    expect(calcularTicketPromedio(0, 0)).toBe(0);
    expect(calcularTicketPromedio(100000, 4)).toBe(25000);
    expect(calcularTicketPromedio(100000, 3)).toBe(33333);
  });
});
