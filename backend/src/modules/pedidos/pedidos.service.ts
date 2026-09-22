import { AppError } from '../../shared/errors.js';
import type { Notificador } from '../notificaciones/notificador.interface.js';
import { formatearMensajePedido } from '../notificaciones/notificador.interface.js';
import { calcularTicketPromedio, resolverRangoPeriodo } from './pedidos.balance.js';
import { buildBalanceWorkbook, type BalanceExportResult } from './balance.export.js';
import type { Egreso } from '../egresos/egresos.types.js';
import { PedidosRepository } from './pedidos.repository.js';
import type {
  ActualizarPedidoInput,
  BalanceVentas,
  ConfirmarPedidoResponse,
  CrearPedidoInput,
  ListaPedidosResponse,
  Pedido,
  PedidoACrear,
  PedidoDetalle,
  PedidoEstado,
  PedidoItemACrear,
  PedidoResumen,
  PeriodoBalance,
  RegistrarPagoInput,
} from './pedidos.types.js';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

export class PedidosService {
  constructor(
    private readonly repository: PedidosRepository,
    private readonly notificador: Notificador,
  ) {}

  /** Compat: pedidos del día calendario Bogotá. */
  listarPorFecha(fecha: string | undefined): PedidoResumen[] {
    if (fecha !== 'hoy') {
      throw new AppError('Parámetro fecha inválido; use fecha=hoy', 400);
    }

    return this.repository.findByFechaHoy();
  }

  listarPaginado(input: {
    limitRaw: string | undefined;
    offsetRaw: string | undefined;
    estadoRaw: string | undefined;
    eliminadosRaw: string | undefined;
  }): ListaPedidosResponse {
    const limit = this.parseLimit(input.limitRaw);
    const offset = this.parseOffset(input.offsetRaw);
    const soloEliminados = input.eliminadosRaw === '1' || input.eliminadosRaw === 'true';
    const estado = soloEliminados ? undefined : this.parseEstado(input.estadoRaw);

    const { items, total } = this.repository.findPaginados({
      limit,
      offset,
      estado,
      soloEliminados,
    });
    return {
      items,
      total,
      limit,
      offset,
      has_more: offset + items.length < total,
    };
  }

  private parseLimit(raw: string | undefined): number {
    if (raw === undefined || raw === '') {
      return DEFAULT_LIMIT;
    }
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 1) {
      throw new AppError('limit debe ser un entero ≥ 1', 400);
    }
    return Math.min(n, MAX_LIMIT);
  }

  private parseOffset(raw: string | undefined): number {
    if (raw === undefined || raw === '') {
      return 0;
    }
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 0) {
      throw new AppError('offset debe ser un entero ≥ 0', 400);
    }
    return n;
  }

  private parseEstado(raw: string | undefined): PedidoEstado | undefined {
    if (raw === undefined || raw === '' || raw === 'todos') {
      return undefined;
    }
    if (raw !== 'pendiente' && raw !== 'pagado') {
      throw new AppError('estado inválido; use pendiente|pagado', 400);
    }
    return raw;
  }

  obtenerBalance(periodoRaw: string | undefined, gastosDelPeriodo = 0): BalanceVentas {
    if (periodoRaw !== 'hoy' && periodoRaw !== 'semana' && periodoRaw !== 'mes') {
      throw new AppError('Parámetro periodo inválido; use hoy|semana|mes', 400);
    }

    const periodo = periodoRaw as PeriodoBalance;
    const { desde, hasta } = resolverRangoPeriodo(periodo);
    const agg = this.repository.findBalanceEntreFechas(desde, hasta);
    const gastos = gastosDelPeriodo;

    return {
      periodo,
      desde,
      hasta,
      cobrado: agg.cobrado,
      cobrado_efectivo: agg.cobrado_efectivo,
      cobrado_transferencia: agg.cobrado_transferencia,
      pedidos_pagados: agg.pedidos_pagados,
      pedidos_efectivo: agg.pedidos_efectivo,
      pedidos_transferencia: agg.pedidos_transferencia,
      ticket_promedio: calcularTicketPromedio(agg.cobrado, agg.pedidos_pagados),
      pendiente: agg.pendiente,
      pedidos_pendientes: agg.pedidos_pendientes,
      gastos,
      ganancia: agg.cobrado - gastos,
    };
  }

  async exportarBalance(
    periodoRaw: string | undefined,
    gastosDelPeriodo: number,
    egresos: Egreso[],
  ): Promise<BalanceExportResult> {
    const balance = this.obtenerBalance(periodoRaw, gastosDelPeriodo);
    const pedidos = this.repository.findActivosEntreFechas(balance.desde, balance.hasta);
    return buildBalanceWorkbook({ balance, pedidos, egresos });
  }

  obtenerPorId(id: number): PedidoDetalle {
    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError('id de pedido inválido', 400);
    }

    const detalle = this.repository.findDetalleVista(id);
    if (!detalle) {
      throw new AppError(`Pedido ${id} no encontrado`, 404);
    }

    return detalle;
  }

  crear(input: CrearPedidoInput): Pedido {
    if (!Array.isArray(input.items) || input.items.length === 0) {
      throw new AppError('El pedido debe incluir al menos un item', 400);
    }

    const itemsPreparados = this.prepararItems(input.items);
    const total = calcularTotal(itemsPreparados);
    const pedidoACrear: PedidoACrear = {
      nombre_cliente: normalizarNombreCliente(input.nombre_cliente),
      total,
      indicaciones: normalizarIndicaciones(input.indicaciones),
      items: itemsPreparados,
    };

    return this.repository.create(pedidoACrear);
  }

  actualizar(id: number, input: ActualizarPedidoInput): PedidoDetalle {
    const pedido = this.obtenerPedidoOFallar(id);
    const cambiaItems = Array.isArray(input.items);
    const cambiaNombre = input.nombre_cliente !== undefined;
    const cambiaIndicaciones = input.indicaciones !== undefined;

    if (!cambiaItems && !cambiaNombre && !cambiaIndicaciones) {
      throw new AppError('Nada que actualizar: envíe nombre_cliente, indicaciones y/o items', 400);
    }

    if (cambiaItems && (!input.items || input.items.length === 0)) {
      throw new AppError('El pedido debe incluir al menos un item', 400);
    }

    const nombre = cambiaNombre
      ? normalizarNombreCliente(input.nombre_cliente)
      : pedido.nombre_cliente;
    const indicaciones = cambiaIndicaciones
      ? normalizarIndicaciones(input.indicaciones)
      : pedido.indicaciones;

    let total = pedido.total;
    let itemsPreparados: PedidoItemACrear[] | undefined;
    let montoPagado = pedido.monto_pagado;
    let vuelto = pedido.vuelto;

    if (cambiaItems) {
      itemsPreparados = this.prepararItems(input.items!);
      total = calcularTotal(itemsPreparados);
      const pago = ajustarPagoTrasEditar({
        estado: pedido.estado,
        es_transferencia: pedido.es_transferencia,
        monto_pagado: pedido.monto_pagado,
        totalAnterior: pedido.total,
        totalNuevo: total,
      });
      montoPagado = pago.monto_pagado;
      vuelto = pago.vuelto;
    }

    this.repository.actualizarPedido(id, {
      nombre_cliente: nombre,
      total,
      monto_pagado: montoPagado,
      vuelto,
      indicaciones,
      items: itemsPreparados,
    });

    return this.obtenerPorId(id);
  }

  eliminar(id: number): void {
    this.obtenerPedidoOFallar(id);
    const ok = this.repository.softDelete(id);
    if (!ok) {
      throw new AppError(`Pedido ${id} no encontrado`, 404);
    }
  }

  restaurar(id: number): PedidoDetalle {
    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError('id de pedido inválido', 400);
    }
    const ok = this.repository.restaurar(id);
    if (!ok) {
      throw new AppError(`Pedido ${id} no está eliminado o no existe`, 404);
    }
    return this.obtenerPorId(id);
  }

  /** Valida y resuelve catálogo → líneas con precios de momento. */
  private prepararItems(items: CrearPedidoInput['items']): PedidoItemACrear[] {
    const itemsPreparados: PedidoItemACrear[] = [];

    for (const item of items) {
      if (!Number.isInteger(item.cantidad) || item.cantidad <= 0) {
        throw new AppError('Cada item debe tener una cantidad entera mayor a 0', 400);
      }

      if (!Number.isInteger(item.producto_id)) {
        throw new AppError('producto_id inválido', 400);
      }

      const producto = this.repository.findProductoById(item.producto_id);
      if (!producto) {
        throw new AppError(`Producto ${item.producto_id} no encontrado`, 404);
      }
      if (!producto.disponible) {
        throw new AppError(`Producto ${item.producto_id} no está disponible`, 400);
      }

      const esBebida = producto.categoria === 'bebidas';
      let baseId: number | null = null;
      let salsaIdsUnicos: number[] = [];

      if (esBebida) {
        if (item.base_id !== undefined && item.base_id !== null) {
          throw new AppError(`El producto ${producto.nombre} no admite base`, 400);
        }
        if (Array.isArray(item.salsa_ids) && item.salsa_ids.length > 0) {
          throw new AppError(`El producto ${producto.nombre} no admite salsas`, 400);
        }
      } else {
        if (!Number.isInteger(item.base_id)) {
          throw new AppError('base_id es obligatorio', 400);
        }

        const base = this.repository.findBaseById(item.base_id as number);
        if (!base) {
          throw new AppError(`Base ${item.base_id} no encontrada`, 404);
        }
        baseId = base.id;

        const salsaIds = Array.isArray(item.salsa_ids) ? item.salsa_ids : [];
        salsaIdsUnicos = [...new Set(salsaIds)];
        for (const salsaId of salsaIdsUnicos) {
          if (!Number.isInteger(salsaId)) {
            throw new AppError('salsa_id inválido', 400);
          }
          const salsa = this.repository.findSalsaById(salsaId);
          if (!salsa) {
            throw new AppError(`Salsa ${salsaId} no encontrada`, 404);
          }
        }
      }

      let proteinaId: number | null = null;
      const proteinaInformada =
        item.proteina_id !== undefined && item.proteina_id !== null;

      if (producto.requiere_proteina) {
        if (!proteinaInformada || !Number.isInteger(item.proteina_id)) {
          throw new AppError(
            `proteina_id es obligatorio para el producto ${producto.nombre}`,
            400,
          );
        }
        const proteina = this.repository.findProteinaById(item.proteina_id as number);
        if (!proteina) {
          throw new AppError(`Proteína ${item.proteina_id} no encontrada`, 404);
        }
        proteinaId = proteina.id;
      } else if (proteinaInformada) {
        throw new AppError(
          `El producto ${producto.nombre} no admite selección de proteína`,
          400,
        );
      }

      const adicionesIds = Array.isArray(item.adiciones) ? item.adiciones : [];
      const adicionesPreparadas: PedidoItemACrear['adiciones'] = [];

      for (const adicionId of adicionesIds) {
        if (!Number.isInteger(adicionId)) {
          throw new AppError('adicion_id inválido', 400);
        }

        const adicion = this.repository.findAdicionById(adicionId);
        if (!adicion) {
          throw new AppError(`Adición ${adicionId} no encontrada`, 404);
        }

        const esGlobal = adicion.producto_id === null;
        const perteneceAlProducto = adicion.producto_id === producto.id;
        if (!esGlobal && !perteneceAlProducto) {
          throw new AppError(
            `Adición ${adicionId} no aplica al producto ${producto.id}`,
            400,
          );
        }

        adicionesPreparadas.push({
          adicion_id: adicion.id,
          precio_momento: adicion.precio,
        });
      }

      itemsPreparados.push({
        producto_id: producto.id,
        cantidad: item.cantidad,
        precio_unit_momento: producto.precio,
        base_id: baseId,
        salsa_ids: salsaIdsUnicos,
        proteina_id: proteinaId,
        adiciones: adicionesPreparadas,
      });
    }

    return itemsPreparados;
  }

  registrarPago(id: number, input: RegistrarPagoInput): Pedido {
    const pedido = this.obtenerPedidoOFallar(id);

    if (pedido.estado !== 'pendiente') {
      throw new AppError('Solo se puede registrar pago en pedidos pendientes', 400);
    }

    if (typeof input.monto_pagado !== 'number' || Number.isNaN(input.monto_pagado)) {
      throw new AppError('monto_pagado debe ser un número', 400);
    }

    if (input.monto_pagado < pedido.total) {
      const faltante = pedido.total - input.monto_pagado;
      throw new AppError('Monto insuficiente', 400, { faltante });
    }

    const vuelto = input.monto_pagado - pedido.total;
    const esTransferencia = input.es_transferencia === true;
    return this.repository.registrarPago(id, input.monto_pagado, vuelto, esTransferencia);
  }

  async confirmar(id: number): Promise<ConfirmarPedidoResponse> {
    const pedido = this.obtenerPedidoOFallar(id);

    if (pedido.estado === 'pagado') {
      throw new AppError('El pedido ya está pagado', 400);
    }

    const montoPagado = pedido.monto_pagado ?? 0;
    if (pedido.monto_pagado === null || montoPagado < pedido.total) {
      const faltante = pedido.total - montoPagado;
      throw new AppError('Monto insuficiente para confirmar', 400, { faltante });
    }

    const pagado = this.repository.marcarPagado(id);
    const detalle = this.repository.findDetalleParaNotificacion(pagado.id);

    const pedidoDto = {
      id: pagado.id,
      nombre_cliente: pagado.nombre_cliente,
      total: pagado.total,
      monto_pagado: pagado.monto_pagado,
      vuelto: pagado.vuelto,
      estado: pagado.estado,
      indicaciones: pagado.indicaciones,
      items:
        detalle?.lineas.map((linea) => ({
          producto_nombre: linea.producto_nombre,
          cantidad: linea.cantidad,
          base_nombre: linea.base_nombre,
          salsa_nombres: linea.salsa_nombres,
          proteina_nombre: linea.proteina_nombre,
          adiciones_nombres: linea.adiciones_nombres,
        })) ?? [],
    };

    const mensaje = formatearMensajePedido(pedidoDto);

    let enviada = false;
    try {
      const resultado = await this.notificador.enviar(pedidoDto);
      enviada = resultado.enviada;
    } catch (error: unknown) {
      console.error(
        `[Notificador] Falló el envío del pedido #${pagado.id}; el pedido permanece pagado`,
        error,
      );
      enviada = false;
    }

    return {
      ...pagado,
      notificacion: {
        enviada,
        mensaje,
      },
    };
  }

  private obtenerPedidoOFallar(id: number): Pedido {
    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError('id de pedido inválido', 400);
    }

    const pedido = this.repository.findById(id);
    if (!pedido) {
      throw new AppError(`Pedido ${id} no encontrado`, 404);
    }

    return pedido;
  }
}

export function normalizarNombreCliente(nombre: string | null | undefined): string {
  if (typeof nombre !== 'string' || nombre.trim() === '') {
    return 'Sin nombre';
  }
  return nombre.trim();
}

export function normalizarIndicaciones(texto: string | null | undefined): string | null {
  if (typeof texto !== 'string') {
    return null;
  }
  const t = texto.trim();
  return t === '' ? null : t;
}

export function calcularTotal(items: PedidoItemACrear[]): number {
  return items.reduce((acumulado, item) => {
    const adicionesPorUnidad = item.adiciones.reduce(
      (suma, adicion) => suma + adicion.precio_momento,
      0,
    );
    const precioPorUnidad = item.precio_unit_momento + adicionesPorUnidad;
    return acumulado + precioPorUnidad * item.cantidad;
  }, 0);
}

/** Ajusta monto/vuelto al cambiar el total de un pedido (pagado o pendiente). */
export function ajustarPagoTrasEditar(input: {
  estado: PedidoEstado;
  es_transferencia: boolean;
  monto_pagado: number | null;
  totalAnterior: number;
  totalNuevo: number;
}): { monto_pagado: number | null; vuelto: number | null } {
  if (input.estado !== 'pagado') {
    return { monto_pagado: null, vuelto: null };
  }

  if (input.es_transferencia) {
    return { monto_pagado: input.totalNuevo, vuelto: 0 };
  }

  const monto = input.monto_pagado ?? input.totalAnterior;
  if (monto < input.totalNuevo) {
    return { monto_pagado: input.totalNuevo, vuelto: 0 };
  }
  return { monto_pagado: monto, vuelto: monto - input.totalNuevo };
}
