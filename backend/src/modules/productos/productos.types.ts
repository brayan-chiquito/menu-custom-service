export type Adicion = {
  id: number;
  nombre: string;
  precio: number;
  producto_id: number | null;
};

export type Producto = {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  disponible: boolean;
  requiere_proteina: boolean;
};

export type ProductoConAdiciones = Producto & {
  adiciones: Adicion[];
};

export type Base = {
  id: number;
  nombre: string;
};

export type Salsa = {
  id: number;
  nombre: string;
};

export type Proteina = {
  id: number;
  nombre: string;
};

export type MenuResponse = {
  productos: ProductoConAdiciones[];
  bases: Base[];
  salsas: Salsa[];
  proteinas: Proteina[];
};
