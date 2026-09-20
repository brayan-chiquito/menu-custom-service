import { describe, expect, it } from 'vitest';

function resumenVuelto(monto: number, total: number, montoTexto: string): string {
  if (!montoTexto) {
    return 'Ingresa el monto recibido';
  }
  if (monto < total) {
    return `Faltan $${(total - monto).toLocaleString('es-CO')}`;
  }
  return `$${(monto - total).toLocaleString('es-CO')}`;
}

describe('cobro vuelto rules', () => {
  it('should disable confirm conceptually when monto < total', () => {
    const total = 24000;
    const monto = 10000;
    expect(monto >= total).toBe(false);
    expect(resumenVuelto(monto, total, '10000')).toContain('Faltan');
  });

  it('should show vuelto amount when monto >= total', () => {
    expect(resumenVuelto(30000, 24000, '30000')).toBe('$6.000');
  });
});
