import { apiFetch } from './client';
import type { WhatsappDestino, WhatsappEstado } from './authTypes';

export function fetchWhatsappEstado(): Promise<WhatsappEstado> {
  return apiFetch<WhatsappEstado>('/whatsapp/estado');
}

export function fetchWhatsappDestinos(): Promise<WhatsappDestino[]> {
  return apiFetch<WhatsappDestino[]>('/whatsapp/destinos');
}

export function crearWhatsappDestino(numero: string): Promise<WhatsappDestino> {
  return apiFetch<WhatsappDestino>('/whatsapp/destinos', {
    method: 'POST',
    body: JSON.stringify({ numero }),
  });
}

export function eliminarWhatsappDestino(id: number): Promise<void> {
  return apiFetch<void>(`/whatsapp/destinos/${id}`, { method: 'DELETE' });
}
