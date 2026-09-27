import { describe, expect, it } from 'vitest';
import type { PedidoResumen } from '../../shared/api/types';

type FiltroHistorial = 'todos' | 'pendiente' | 'pagado' | 'eliminados';

function filtrarPedidos(
  pedidos: PedidoResumen[],
  filtro: FiltroHistorial,
): PedidoResumen[] {
  if (filtro === 'eliminados') {
    return pedidos.filter((p) => Boolean(p.eliminado_at));
  }
  const activos = pedidos.filter((p) => !p.eliminado_at);
  if (filtro === 'todos') {
    return activos;
  }
  return activos.filter((pedido) => pedido.estado === filtro);
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
      es_transferencia: false,
      indicaciones: null,
      created_at: '2026-09-18 12:00:00',
    },
    {
      id: 2,
      nombre_cliente: 'Sin nombre',
      total: 20000,
      monto_pagado: null,
      vuelto: null,
      estado: 'pendiente',
      es_transferencia: false,
      indicaciones: 'Sin cebolla',
      created_at: '2026-09-18 12:10:00',
    },
    {
      id: 3,
      nombre_cliente: 'Borrado',
      total: 15000,
      monto_pagado: null,
      vuelto: null,
      estado: 'pendiente',
      es_transferencia: false,
      indicaciones: null,
      eliminado_at: '2026-09-20 10:00:00',
      created_at: '2026-09-18 11:00:00',
    },
  ];

  it('should filter pendientes and pagados among active', () => {
    expect(filtrarPedidos(sample, 'pendiente')).toHaveLength(1);
    expect(filtrarPedidos(sample, 'pagado')).toHaveLength(1);
    expect(filtrarPedidos(sample, 'todos')).toHaveLength(2);
  });

  it('should filter eliminados separately', () => {
    expect(filtrarPedidos(sample, 'eliminados')).toHaveLength(1);
    expect(filtrarPedidos(sample, 'eliminados')[0].id).toBe(3);
  });
});
