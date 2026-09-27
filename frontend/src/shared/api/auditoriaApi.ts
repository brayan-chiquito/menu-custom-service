import { apiFetch } from './client';
import type { ListaAuditoriaResponse } from './authTypes';

export function fetchAuditoria(params?: {
  limit?: number;
  offset?: number;
}): Promise<ListaAuditoriaResponse> {
  const q = new URLSearchParams();
  q.set('limit', String(params?.limit ?? 50));
  q.set('offset', String(params?.offset ?? 0));
  return apiFetch<ListaAuditoriaResponse>(`/auditoria?${q.toString()}`);
}
