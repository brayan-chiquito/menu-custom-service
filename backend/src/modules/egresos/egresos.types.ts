export type Egreso = {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
  total: number;
  created_at: string;
};

export type CrearEgresoInput = {
  nombre: string;
  precio: number;
  cantidad: number;
};
