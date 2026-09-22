export type PedidoItemNotificacion = {
  producto_nombre: string;
  cantidad: number;
  base_nombre: string | null;
  salsa_nombres: string[];
  proteina_nombre: string | null;
  adiciones_nombres: string[];
};

export type PedidoDTO = {
  id: number;
  nombre_cliente: string;
  total: number;
  monto_pagado: number | null;
  vuelto: number | null;
  estado: string;
  indicaciones?: string | null;
  items: PedidoItemNotificacion[];
};

export type ResultadoNotificacion = {
  enviada: boolean;
};

export type NotificacionResponse = {
  enviada: boolean;
  mensaje: string;
};

export interface Notificador {
  /** Nunca debe lanzar: fallos → { enviada: false } + log. */
  enviar(pedido: PedidoDTO): Promise<ResultadoNotificacion>;
}

export function formatearMensajePedido(pedido: PedidoDTO): string {
  const lineas = pedido.items.map((item) => {
    const detalle: string[] = [];
    if (item.base_nombre) {
      detalle.push(`base: ${item.base_nombre}`);
    }
    if (item.salsa_nombres.length > 0) {
      detalle.push(`salsas: ${item.salsa_nombres.join(', ')}`);
    }
    if (item.proteina_nombre) {
      detalle.push(`proteína: ${item.proteina_nombre}`);
    }
    if (item.adiciones_nombres.length > 0) {
      detalle.push(`extras: ${item.adiciones_nombres.join(', ')}`);
    }
    const extras = detalle.length > 0 ? ` (${detalle.join(', ')})` : '';
    return `- ${item.cantidad}x ${item.producto_nombre}${extras}`;
  });

  return [
    `Pedido #${pedido.id}`,
    `Cliente: ${pedido.nombre_cliente}`,
    ...(pedido.indicaciones && pedido.indicaciones.trim() !== ''
      ? [`Indicaciones: ${pedido.indicaciones.trim()}`]
      : []),
    'Detalle:',
    ...lineas,
    `Total: $${pedido.total}`,
  ].join('\n');
}
