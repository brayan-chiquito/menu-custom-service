export type RolUsuario = 'operador' | 'admin';

export type UsuarioPublico = {
  id: number;
  usuario: string;
  nombre: string;
  rol: RolUsuario;
};

export type LoginResponse = {
  token: string;
  usuario: UsuarioPublico;
};

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

export type AuditoriaEntry = {
  id: number;
  usuario_id: number | null;
  usuario: string | null;
  nombre: string | null;
  accion: string;
  entidad: string;
  entidad_id: string | null;
  detalle: string | null;
  created_at: string;
};

export type ListaAuditoriaResponse = {
  items: AuditoriaEntry[];
  total: number;
  limit: number;
  offset: number;
};

export type CocinaItemResumen = {
  producto_nombre: string;
  cantidad: number;
  extras: string[];
  indicaciones: string | null;
};

export type CocinaPedido = {
  id: number;
  nombre_cliente: string;
  estado: 'pendiente' | 'pagado';
  indicaciones: string | null;
  created_at: string;
  items: CocinaItemResumen[];
};

export type WhatsappDestino = {
  id: number;
  numero: string;
  created_at: string;
};

export type WhatsappEstado = {
  activa: boolean;
  qr: string | null;
};
