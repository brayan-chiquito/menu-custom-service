import type { RolUsuario, UsuarioPublico } from '../auth/auth.types.js';

export type UsuarioAdmin = UsuarioPublico & {
  activo: boolean;
  created_at: string;
};

export type CrearUsuarioInput = {
  usuario: string;
  nombre: string;
  rol: RolUsuario;
  password: string;
};

export type ActualizarUsuarioInput = {
  nombre?: string;
  rol?: RolUsuario;
  activo?: boolean;
  password?: string;
};
