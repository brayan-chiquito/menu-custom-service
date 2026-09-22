import { describe, expect, it } from 'vitest';
import { calcularTotalEgreso } from './egresos.calc';

describe('egresos.calc', () => {
  it('should multiply precio by cantidad', () => {
    expect(calcularTotalEgreso(2000, 3)).toBe(6000);
    expect(calcularTotalEgreso(0, 5)).toBe(0);
  });
});
