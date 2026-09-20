import { apiFetch } from './client';
import type {
  BalanceVentas,
  ConfirmarPedidoResponse,
  CrearPedidoItemPayload,
  PedidoCreado,
  PedidoDetalle,
  PedidoResumen,
  PeriodoBalance,
} from './types';

export function crearPedido(input: {
  nombre_cliente?: string | null;
  items: CrearPedidoItemPayload[];
}): Promise<PedidoCreado> {
  return apiFetch<PedidoCreado>('/pedidos', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function fetchPedidoById(id: number): Promise<PedidoDetalle> {
  return apiFetch<PedidoDetalle>(`/pedidos/${id}`);
}

export function registrarPago(id: number, monto_pagado: number): Promise<PedidoCreado> {
  return apiFetch<PedidoCreado>(`/pedidos/${id}/pago`, {
    method: 'PATCH',
    body: JSON.stringify({ monto_pagado }),
  });
}

export function confirmarPedido(id: number): Promise<ConfirmarPedidoResponse> {
  return apiFetch<ConfirmarPedidoResponse>(`/pedidos/${id}/confirmar`, {
    method: 'PATCH',
  });
}

export function fetchPedidosHoy(): Promise<PedidoResumen[]> {
  return apiFetch<PedidoResumen[]>('/pedidos?fecha=hoy');
}

export function fetchBalance(periodo: PeriodoBalance): Promise<BalanceVentas> {
  return apiFetch<BalanceVentas>(`/pedidos/balance?periodo=${periodo}`);
}
