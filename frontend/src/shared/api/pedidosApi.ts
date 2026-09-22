import { ApiError, apiFetch, getApiBaseUrl } from './client';
import type {
  BalanceVentas,
  ConfirmarPedidoResponse,
  CrearPedidoItemPayload,
  ListaPedidosResponse,
  PedidoCreado,
  PedidoDetalle,
  PeriodoBalance,
} from './types';

export function crearPedido(input: {
  nombre_cliente?: string | null;
  indicaciones?: string | null;
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

export function registrarPago(
  id: number,
  monto_pagado: number,
  es_transferencia = false,
): Promise<PedidoCreado> {
  return apiFetch<PedidoCreado>(`/pedidos/${id}/pago`, {
    method: 'PATCH',
    body: JSON.stringify({ monto_pagado, es_transferencia }),
  });
}

export function confirmarPedido(id: number): Promise<ConfirmarPedidoResponse> {
  return apiFetch<ConfirmarPedidoResponse>(`/pedidos/${id}/confirmar`, {
    method: 'PATCH',
  });
}

export function fetchPedidos(params: {
  limit?: number;
  offset?: number;
  estado?: 'pendiente' | 'pagado';
  eliminados?: boolean;
}): Promise<ListaPedidosResponse> {
  const q = new URLSearchParams();
  q.set('limit', String(params.limit ?? 10));
  q.set('offset', String(params.offset ?? 0));
  if (params.eliminados) {
    q.set('eliminados', '1');
  } else if (params.estado) {
    q.set('estado', params.estado);
  }
  return apiFetch<ListaPedidosResponse>(`/pedidos?${q.toString()}`);
}

export function fetchBalance(periodo: PeriodoBalance): Promise<BalanceVentas> {
  return apiFetch<BalanceVentas>(`/pedidos/balance?periodo=${periodo}`);
}

export async function downloadBalanceExport(
  periodo: PeriodoBalance,
  suggestedFilename?: string,
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(
      `${getApiBaseUrl()}/pedidos/balance/export?periodo=${periodo}`,
    );
  } catch (error: unknown) {
    throw new ApiError('Sin conexión. Revisa la red e intenta de nuevo.', 0, error);
  }
  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      /* ignore */
    }
    throw new ApiError(message, response.status);
  }
  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition') ?? '';
  const match = /filename\*?=(?:UTF-8''|")?([^";]+)"?/i.exec(disposition);
  const fromHeader = match?.[1] ? decodeURIComponent(match[1].replace(/['"]/g, '')) : '';
  const filename =
    (fromHeader && fromHeader.includes('platanopolis') ? fromHeader : null) ||
    suggestedFilename ||
    `balance-platanopolis-${periodo}.xlsx`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function actualizarPedido(
  id: number,
  body: {
    nombre_cliente?: string | null;
    indicaciones?: string | null;
    items?: CrearPedidoItemPayload[];
  },
): Promise<PedidoDetalle> {
  return apiFetch<PedidoDetalle>(`/pedidos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function eliminarPedido(id: number): Promise<void> {
  return apiFetch(`/pedidos/${id}`, { method: 'DELETE' });
}

export function restaurarPedido(id: number): Promise<PedidoDetalle> {
  return apiFetch<PedidoDetalle>(`/pedidos/${id}/restaurar`, { method: 'PATCH' });
}
