export type RolUsuario = 'operador' | 'admin';

export type UsuarioPublico = {
  id: number;
  usuario: string;
  nombre: string;
  rol: RolUsuario;
};

export type Usuario = UsuarioPublico & {
  activo: boolean;
  password_hash: string;
  created_at: string;
};

export type Sesion = {
  id: number;
  token: string;
  usuario_id: number;
  created_at: string;
  last_seen_at: string;
};

export type LoginInput = {
  usuario: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  usuario: UsuarioPublico;
  expires_in_hours?: number;
};
