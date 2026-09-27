import { apiFetch } from './client';
import type {
  ActualizarUsuarioInput,
  CrearUsuarioInput,
  UsuarioAdmin,
} from './authTypes';

export function fetchUsuarios(): Promise<UsuarioAdmin[]> {
  return apiFetch<UsuarioAdmin[]>('/usuarios');
}

export function crearUsuario(input: CrearUsuarioInput): Promise<UsuarioAdmin> {
  return apiFetch<UsuarioAdmin>('/usuarios', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function actualizarUsuario(
  id: number,
  input: ActualizarUsuarioInput,
): Promise<UsuarioAdmin> {
  return apiFetch<UsuarioAdmin>(`/usuarios/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function revocarSesiones(id: number): Promise<{ revocadas: number }> {
  return apiFetch<{ revocadas: number }>(`/usuarios/${id}/sesiones`, {
    method: 'DELETE',
  });
}
