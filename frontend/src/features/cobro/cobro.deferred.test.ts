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
