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
