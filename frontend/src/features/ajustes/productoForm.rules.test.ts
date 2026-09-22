import { describe, expect, it } from 'vitest';
import { canSaveProducto, resolveRequiereProteina } from './productoForm.rules';

describe('productoForm.rules', () => {
  it('should force requiere_proteina false for bebidas', () => {
    expect(resolveRequiereProteina('bebidas', true)).toBe(false);
    expect(resolveRequiereProteina('platos', true)).toBe(true);
    expect(resolveRequiereProteina('platos', false)).toBe(false);
  });

  it('should validate save payload', () => {
    expect(canSaveProducto({ nombre: 'Candente', precio: 12000 })).toBe(true);
    expect(canSaveProducto({ nombre: '  ', precio: 12000 })).toBe(false);
    expect(canSaveProducto({ nombre: 'X', precio: -1 })).toBe(false);
    expect(canSaveProducto({ nombre: 'X', precio: 1000, guardando: true })).toBe(false);
  });
});
