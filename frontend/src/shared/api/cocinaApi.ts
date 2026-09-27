import { apiFetch, getApiBaseUrl } from './client';
import type { CocinaPedido } from './authTypes';
import type { PedidoDetalle } from './types';

export function fetchCocinaCola(): Promise<CocinaPedido[]> {
  return apiFetch<CocinaPedido[]>('/cocina');
}

export function prepararPedido(id: number): Promise<PedidoDetalle> {
  return apiFetch<PedidoDetalle>(`/pedidos/${id}/preparar`, { method: 'PATCH' });
}

export async function fetchCocinaStreamTicket(): Promise<{ ticket: string; expiresIn: number }> {
  return apiFetch<{ ticket: string; expiresIn: number }>('/cocina/stream-ticket', {
    method: 'POST',
  });
}

/** URL SSE con ticket corto (no el token de sesión). */
export function cocinaStreamUrl(ticket: string): string {
  const base = getApiBaseUrl().replace(/\/$/, '');
  return `${base}/cocina/stream?ticket=${encodeURIComponent(ticket)}`;
}
