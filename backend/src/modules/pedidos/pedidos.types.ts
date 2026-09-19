export type PedidoEstado = 'pendiente' | 'pagado';

export type CrearPedidoItemInput = {
  producto_id: number;
  cantidad: number;
  base_id?: number | null;
  salsa_ids?: number[];
  proteina_id?: number | null;
  adiciones: number[];
};

export type CrearPedidoInput = {
  nombre_cliente?: string | null;
  items: CrearPedidoItemInput[];
};

export type PedidoItemAdicion = {
  id: number;
  adicion_id: number;
  precio_momento: number;
};

export type PedidoItemSalsa = {
  id: number;
  salsa_id: number;
};

export type PedidoItem = {
  id: number;
  producto_id: number;
  cantidad: number;
  precio_unit_momento: number;
  base_id: number | null;
  salsa_ids: number[];
  salsas: PedidoItemSalsa[];
  proteina_id: number | null;
  adiciones: PedidoItemAdicion[];
};

export type Pedido = {
  id: number;
  nombre_cliente: string;
  total: number;
  monto_pagado: number | null;
  vuelto: number | null;
  estado: PedidoEstado;
  created_at: string;
  items: PedidoItem[];
};

/** Resumen para listados (historial); sin items. */
export type PedidoResumen = {
  id: number;
  nombre_cliente: string;
  total: number;
  monto_pagado: number | null;
  vuelto: number | null;
  estado: PedidoEstado;
  created_at: string;
};

export type PeriodoBalance = 'hoy' | 'semana' | 'mes';

/** Agregados de ventas para GET /pedidos/balance. */
export type BalanceVentas = {
  periodo: PeriodoBalance;
  desde: string;
  hasta: string;
  cobrado: number;
  pedidos_pagados: number;
  ticket_promedio: number;
  pendiente: number;
  pedidos_pendientes: number;
};

/** Línea legible para UI de detalle en historial. */
export type PedidoDetalleLinea = {
  cantidad: number;
  producto_nombre: string;
  base_nombre: string | null;
  salsa_nombres: string[];
  proteina_nombre: string | null;
  adiciones: Array<{ nombre: string; precio_momento: number }>;
  precio_unit_momento: number;
  subtotal: number;
};

/** Detalle completo para GET /pedidos/:id (cobro diferido + historial). */
export type PedidoDetalle = {
  id: number;
  nombre_cliente: string;
  total: number;
  monto_pagado: number | null;
  vuelto: number | null;
  estado: PedidoEstado;
  created_at: string;
  lineas: PedidoDetalleLinea[];
};

export type CatalogoProducto = {
  id: number;
  nombre: string;
  precio: number;
  disponible: boolean;
  requiere_proteina: boolean;
  categoria: string;
};

export type CatalogoAdicion = {
  id: number;
  nombre: string;
  precio: number;
  producto_id: number | null;
};

export type CatalogoRef = {
  id: number;
  nombre: string;
};

export type PedidoItemACrear = {
  producto_id: number;
  cantidad: number;
  precio_unit_momento: number;
  base_id: number | null;
  salsa_ids: number[];
  proteina_id: number | null;
  adiciones: Array<{
    adicion_id: number;
    precio_momento: number;
  }>;
};

export type PedidoACrear = {
  nombre_cliente: string;
  total: number;
  items: PedidoItemACrear[];
};

export type RegistrarPagoInput = {
  monto_pagado: number;
};

export type ConfirmarPedidoResponse = Pedido & {
  notificacion: {
    enviada: boolean;
    mensaje: string;
  };
};
