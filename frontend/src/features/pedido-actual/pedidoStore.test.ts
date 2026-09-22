import { beforeEach, describe, expect, it } from 'vitest';
import { calcularLineTotal, usePedidoStore } from './pedidoStore';

describe('pedidoStore', () => {
  beforeEach(() => {
    usePedidoStore.getState().clear();
  });

  it('should add item and compute total with toppings', () => {
    usePedidoStore.getState().addItem({
      producto_id: 2,
      nombre: 'Candente',
      precio_unitario: 22000,
      base_id: 1,
      base_nombre: 'Maduro',
      salsa_ids: [4],
      salsa_nombres: ['BBQ'],
      proteina_id: 1,
      proteina_nombre: 'Carne',
      adiciones: [{ id: 4, nombre: 'Guacamole', precio: 2000 }],
    });

    const state = usePedidoStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].proteina_id).toBe(1);
    expect(state.total()).toBe(24000);
    expect(calcularLineTotal(state.items[0])).toBe(24000);
  });

  it('should keep proteina_id null when not required', () => {
    usePedidoStore.getState().addItem({
      producto_id: 4,
      nombre: 'Apoteósico',
      precio_unitario: 20000,
      base_id: 1,
      base_nombre: 'Maduro',
      salsa_ids: [1, 4],
      salsa_nombres: ['Ajo', 'BBQ'],
      proteina_id: null,
      proteina_nombre: null,
      adiciones: [],
    });

    expect(usePedidoStore.getState().items[0].proteina_id).toBeNull();
    expect(usePedidoStore.getState().items[0].salsa_ids).toEqual([1, 4]);
  });

  it('should clear indicaciones when checkbox turns off', () => {
    const store = usePedidoStore.getState();
    store.setIndicacionesActivas(true);
    store.setIndicaciones('Sin chicharrón');
    expect(usePedidoStore.getState().indicaciones).toBe('Sin chicharrón');
    usePedidoStore.getState().setIndicacionesActivas(false);
    expect(usePedidoStore.getState().indicacionesActivas).toBe(false);
    expect(usePedidoStore.getState().indicaciones).toBe('');
  });
});
