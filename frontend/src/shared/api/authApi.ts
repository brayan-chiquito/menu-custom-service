import { apiFetch } from './client';
import type { LoginResponse, UsuarioPublico } from './authTypes';

export function login(usuario: string, password: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ usuario, password }),
  });
}

export function logout(): Promise<void> {
  return apiFetch<void>('/auth/logout', { method: 'POST' });
}

export function fetchMe(): Promise<UsuarioPublico> {
  return apiFetch<UsuarioPublico>('/auth/me');
}
