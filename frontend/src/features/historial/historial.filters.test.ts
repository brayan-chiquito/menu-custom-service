import { describe, expect, it } from 'vitest';
import type { PedidoResumen } from '../../shared/api/types';

function filtrarPedidos(
  pedidos: PedidoResumen[],
  filtro: 'todos' | 'pendiente' | 'pagado',
): PedidoResumen[] {
  if (filtro === 'todos') {
    return pedidos;
  }
  return pedidos.filter((pedido) => pedido.estado === filtro);
}

describe('historial filters', () => {
  const sample: PedidoResumen[] = [
    {
      id: 1,
      nombre_cliente: 'Ana',
      total: 10000,
      monto_pagado: 10000,
      vuelto: 0,
      estado: 'pagado',
      created_at: '2026-09-18 12:00:00',
    },
    {
      id: 2,
      nombre_cliente: 'Sin nombre',
      total: 20000,
      monto_pagado: null,
      vuelto: null,
      estado: 'pendiente',
      created_at: '2026-09-18 12:10:00',
    },
  ];

  it('should filter pendientes and pagados', () => {
    expect(filtrarPedidos(sample, 'pendiente')).toHaveLength(1);
    expect(filtrarPedidos(sample, 'pagado')).toHaveLength(1);
    expect(filtrarPedidos(sample, 'todos')).toHaveLength(2);
  });
});
