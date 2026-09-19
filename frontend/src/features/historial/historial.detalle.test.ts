import { describe, expect, it } from 'vitest';
import type { PedidoDetalleLinea } from '../../shared/api/types';
import { formatearLineaDetalle } from './historial.format';

describe('historial detalle formatting', () => {
  it('should join base, salsas, proteina and toppings', () => {
    const linea: PedidoDetalleLinea = {
      cantidad: 2,
      producto_nombre: 'Candente',
      base_nombre: 'Maduro',
      salsa_nombres: ['BBQ', 'Ajo'],
      proteina_nombre: 'Carne',
      adiciones: [{ nombre: 'Guacamole', precio_momento: 2000 }],
      precio_unit_momento: 22000,
      subtotal: 48000,
    };

    expect(formatearLineaDetalle(linea)).toBe('Maduro · BBQ, Ajo · Carne · Guacamole');
  });

  it('should omit empty optional parts', () => {
    const linea: PedidoDetalleLinea = {
      cantidad: 1,
      producto_nombre: 'Apoteósico',
      base_nombre: 'Verde',
      salsa_nombres: ['Ranchera'],
      proteina_nombre: null,
      adiciones: [],
      precio_unit_momento: 20000,
      subtotal: 20000,
    };

    expect(formatearLineaDetalle(linea)).toBe('Verde · Ranchera');
  });

  it('should format bebida without base', () => {
    const linea: PedidoDetalleLinea = {
      cantidad: 1,
      producto_nombre: 'Limonada de coco',
      base_nombre: null,
      salsa_nombres: [],
      proteina_nombre: null,
      adiciones: [],
      precio_unit_momento: 3000,
      subtotal: 3000,
    };

    expect(formatearLineaDetalle(linea)).toBe('');
  });
});

describe('historial detalle sheet state', () => {
  it('should open sheet for one id and close without expand toggle', () => {
    let detalleId: number | null = null;

    function abrirDetalle(id: number) {
      detalleId = id;
    }
    function cerrarDetalle() {
      detalleId = null;
    }

    abrirDetalle(7);
    expect(detalleId).toBe(7);

    abrirDetalle(12);
    expect(detalleId).toBe(12);

    cerrarDetalle();
    expect(detalleId).toBeNull();
  });
});
