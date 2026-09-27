import { describe, expect, it } from 'vitest';

/** Mirrors backend ajustarPagoTrasEditar for UI expectations. */
function ajustarPagoTrasEditar(input: {
  estado: 'pendiente' | 'pagado';
  es_transferencia: boolean;
  monto_pagado: number | null;
  totalAnterior: number;
  totalNuevo: number;
}): { monto_pagado: number | null; vuelto: number | null } {
  if (input.estado !== 'pagado') {
    return { monto_pagado: null, vuelto: null };
  }
  if (input.es_transferencia) {
    return { monto_pagado: input.totalNuevo, vuelto: 0 };
  }
  const monto = input.monto_pagado ?? input.totalAnterior;
  if (monto < input.totalNuevo) {
    return { monto_pagado: input.totalNuevo, vuelto: 0 };
  }
  return { monto_pagado: monto, vuelto: monto - input.totalNuevo };
}

describe('historial edit pago rules', () => {
  it('should bump paid efectivo when total grows', () => {
    expect(
      ajustarPagoTrasEditar({
        estado: 'pagado',
        es_transferencia: false,
        monto_pagado: 10000,
        totalAnterior: 10000,
        totalNuevo: 15000,
      }),
    ).toEqual({ monto_pagado: 15000, vuelto: 0 });
  });
});
