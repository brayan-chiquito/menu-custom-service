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
