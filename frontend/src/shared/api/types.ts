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
  adiciones: Adicion[];
};

export type CatalogoSimple = {
  id: number;
  nombre: string;
};

export type MenuResponse = {
  productos: Producto[];
  bases: CatalogoSimple[];
  salsas: CatalogoSimple[];
  proteinas: CatalogoSimple[];
};

export type CartAdicion = {
  id: number;
  nombre: string;
  precio: number;
};

export type CartItem = {
  key: string;
  producto_id: number;
  nombre: string;
  precio_unitario: number;
  cantidad: number;
  base_id: number | null;
  base_nombre: string | null;
  salsa_ids: number[];
  salsa_nombres: string[];
  proteina_id: number | null;
  proteina_nombre: string | null;
  adiciones: CartAdicion[];
};

export type CrearPedidoItemPayload = {
  producto_id: number;
  cantidad: number;
  base_id: number | null;
  salsa_ids: number[];
  proteina_id: number | null;
  adiciones: number[];
};

export type PedidoCreado = {
  id: number;
  nombre_cliente: string;
  total: number;
  monto_pagado: number | null;
  vuelto: number | null;
  estado: 'pendiente' | 'pagado';
  es_transferencia: boolean;
  indicaciones: string | null;
  created_at: string;
};

export type PedidoDetalleLinea = {
  cantidad: number;
  producto_id: number;
  producto_nombre: string;
  base_id: number | null;
  base_nombre: string | null;
  salsa_ids: number[];
  salsa_nombres: string[];
  proteina_id: number | null;
  proteina_nombre: string | null;
  adiciones: Array<{ adicion_id: number; nombre: string; precio_momento: number }>;
  precio_unit_momento: number;
  subtotal: number;
};

export type PedidoDetalle = PedidoCreado & {
  lineas: PedidoDetalleLinea[];
  eliminado_at?: string | null;
};

export type ConfirmarPedidoResponse = PedidoCreado & {
  notificacion: {
    enviada: boolean;
    mensaje: string;
  };
};

export type PedidoResumen = {
  id: number;
  nombre_cliente: string;
  total: number;
  monto_pagado: number | null;
  vuelto: number | null;
  estado: 'pendiente' | 'pagado';
  es_transferencia: boolean;
  indicaciones: string | null;
  eliminado_at?: string | null;
  created_at: string;
};

export type ListaPedidosResponse = {
  items: PedidoResumen[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
};

export type PeriodoBalance = 'hoy' | 'semana' | 'mes';

export type BalanceVentas = {
  periodo: PeriodoBalance;
  desde: string;
  hasta: string;
  cobrado: number;
  cobrado_efectivo: number;
  cobrado_transferencia: number;
  pedidos_pagados: number;
  pedidos_efectivo: number;
  pedidos_transferencia: number;
  ticket_promedio: number;
  pendiente: number;
  pedidos_pendientes: number;
  gastos: number;
  ganancia: number;
};

export type Egreso = {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
  total: number;
  created_at: string;
};
