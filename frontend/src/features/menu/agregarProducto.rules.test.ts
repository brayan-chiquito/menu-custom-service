import { describe, expect, it } from 'vitest';
import { puedeAgregarProducto } from './agregarProducto.rules';

describe('agregar producto rules', () => {
  it('should require base and at least one salsa for platos', () => {
    expect(
      puedeAgregarProducto({
        categoria: 'platos',
        baseId: null,
        salsaIds: [1],
        proteinaId: 1,
        requiere_proteina: true,
      }),
    ).toBe(false);

    expect(
      puedeAgregarProducto({
        categoria: 'platos',
        baseId: 1,
        salsaIds: [],
        proteinaId: 1,
        requiere_proteina: true,
      }),
    ).toBe(false);
  });

  it('should allow multiple salsas', () => {
    expect(
      puedeAgregarProducto({
        categoria: 'platos',
        baseId: 1,
        salsaIds: [1, 2],
        proteinaId: null,
        requiere_proteina: false,
      }),
    ).toBe(true);
  });

  it('should require proteina only when requiere_proteina is true', () => {
    expect(
      puedeAgregarProducto({
        categoria: 'platos',
        baseId: 1,
        salsaIds: [1],
        proteinaId: null,
        requiere_proteina: true,
      }),
    ).toBe(false);

    expect(
      puedeAgregarProducto({
        categoria: 'platos',
        baseId: 1,
        salsaIds: [1],
        proteinaId: null,
        requiere_proteina: false,
      }),
    ).toBe(true);
  });

  it('should allow bebidas without base or salsa', () => {
    expect(
      puedeAgregarProducto({
        categoria: 'bebidas',
        baseId: null,
        salsaIds: [],
        proteinaId: null,
        requiere_proteina: false,
      }),
    ).toBe(true);
  });
});
