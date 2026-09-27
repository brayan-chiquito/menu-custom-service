import { describe, expect, it } from 'vitest';

/** Reglas de cobro: carrito nuevo vs pedido pendiente ya guardado. */
function resolverFlujoCobro(input: {
  pedidoId: number | null;
  itemsEnCarrito: number;
}): 'carrito' | 'pendiente' | 'vacio' {
  if (input.pedidoId !== null) {
    return 'pendiente';
  }
  if (input.itemsEnCarrito > 0) {
    return 'carrito';
  }
  return 'vacio';
}

describe('cobro diferido rules', () => {
  it('should use pendiente mode when route has pedidoId', () => {
    expect(resolverFlujoCobro({ pedidoId: 3, itemsEnCarrito: 0 })).toBe('pendiente');
    expect(resolverFlujoCobro({ pedidoId: 3, itemsEnCarrito: 2 })).toBe('pendiente');
  });

  it('should use cart mode without pedidoId', () => {
    expect(resolverFlujoCobro({ pedidoId: null, itemsEnCarrito: 1 })).toBe('carrito');
    expect(resolverFlujoCobro({ pedidoId: null, itemsEnCarrito: 0 })).toBe('vacio');
  });
});

/** Transferencia: monto = total exacto; input bloqueado en UI. */
function resolverMontoCobro(input: {
  esTransferencia: boolean;
  total: number;
  montoEscrito: string;
}): number {
  if (input.esTransferencia) {
    return input.total;
  }
  return Number(input.montoEscrito.replace(/\D/g, '')) || 0;
}

describe('cobro transferencia monto', () => {
  it('should force exact total when transferencia', () => {
    expect(
      resolverMontoCobro({ esTransferencia: true, total: 22000, montoEscrito: '0' }),
    ).toBe(22000);
  });

  it('should use typed amount when efectivo', () => {
    expect(
      resolverMontoCobro({ esTransferencia: false, total: 22000, montoEscrito: '50000' }),
    ).toBe(50000);
  });
});
