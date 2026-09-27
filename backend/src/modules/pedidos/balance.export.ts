import ExcelJS from 'exceljs';
import type { BalanceVentas, PedidoResumen, PeriodoBalance } from './pedidos.types.js';
import type { Egreso } from '../egresos/egresos.types.js';

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const MESES_ES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

export type BalanceExportResult = {
  buffer: Buffer;
  filename: string;
  contentType: string;
};

/** Nombre de archivo legible según periodo (fechas Bogotá en el nombre). */
export function nombreArchivoBalance(balance: Pick<BalanceVentas, 'periodo' | 'desde' | 'hasta'>): string {
  const { periodo, desde, hasta } = balance;
  if (periodo === 'hoy') {
    return `balance-platanopolis-hoy-${desde}.xlsx`;
  }
  if (periodo === 'semana') {
    return `balance-platanopolis-semana-${desde}_al_${hasta}.xlsx`;
  }
  // mes: balance-platanopolis-mes-2026-09.xlsx (año-mes del rango)
  const ym = desde.slice(0, 7);
  return `balance-platanopolis-mes-${ym}.xlsx`;
}

/** Etiqueta humana del periodo para la hoja Resumen. */
export function etiquetaPeriodoBalance(
  periodo: PeriodoBalance,
  desde: string,
  hasta: string,
): string {
  if (periodo === 'hoy') {
    return `Hoy (${formatearFechaCorta(desde)})`;
  }
  if (periodo === 'semana') {
    return `Semana (${formatearFechaCorta(desde)} al ${formatearFechaCorta(hasta)})`;
  }
  const [y, m] = desde.split('-').map(Number);
  const mesNombre = MESES_ES[(m ?? 1) - 1] ?? String(m);
  return `Mes (${mesNombre} ${y}) — del ${formatearFechaCorta(desde)} al ${formatearFechaCorta(hasta)}`;
}

function formatearFechaCorta(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  const mes = MESES_ES[m - 1]?.slice(0, 3) ?? String(m);
  return `${d} ${mes} ${y}`;
}

function formatFechaHoraBogota(createdAt: string): { fecha: string; hora: string } {
  const iso = createdAt.includes('T') ? createdAt : `${createdAt.replace(' ', 'T')}Z`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    const [fecha, hora = ''] = createdAt.split(' ');
    return { fecha: fecha ?? createdAt, hora: (hora ?? '').slice(0, 5) };
  }
  const fecha = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
  const hora = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Bogota',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
  return { fecha, hora };
}

function medioPago(p: PedidoResumen): string {
  if (p.estado !== 'pagado') return '—';
  return p.es_transferencia ? 'Transfer' : 'Efectivo';
}

function estiloEncabezado(row: ExcelJS.Row): void {
  row.font = { bold: true, color: { argb: 'FF1C2A1F' } };
  row.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE8F3EA' },
  };
}

function aplicarTablaConFiltros(
  sheet: ExcelJS.Worksheet,
  headerRow: number,
  colCount: number,
  dataRows: number,
): void {
  const lastRow = headerRow + Math.max(dataRows, 0);
  sheet.autoFilter = {
    from: { row: headerRow, column: 1 },
    to: { row: Math.max(lastRow, headerRow), column: colCount },
  };
  sheet.views = [{ state: 'frozen', ySplit: headerRow }];
}

export async function buildBalanceWorkbook(input: {
  balance: BalanceVentas;
  pedidos: PedidoResumen[];
  egresos: Egreso[];
}): Promise<BalanceExportResult> {
  const { balance, pedidos, egresos } = input;
  const periodoLabel = etiquetaPeriodoBalance(balance.periodo, balance.desde, balance.hasta);
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Platanópolis';
  wb.created = new Date();

  const resumen = wb.addWorksheet('Resumen', {
    properties: { defaultColWidth: 28 },
  });
  resumen.getColumn(1).width = 28;
  resumen.getColumn(2).width = 42;
  const resumenRows: Array<[string, string | number]> = [
    ['Periodo', periodoLabel],
    ['Desde', balance.desde],
    ['Hasta', balance.hasta],
    ['Cobrado', balance.cobrado],
    ['Efectivo', balance.cobrado_efectivo],
    ['Transferencia', balance.cobrado_transferencia],
    ['Gastos', balance.gastos],
    ['Ganancia', balance.ganancia],
    ['Pedidos pagados', balance.pedidos_pagados],
    ['Ticket promedio', balance.ticket_promedio],
    ['Pendiente por cobrar', balance.pendiente],
    ['Pedidos pendientes', balance.pedidos_pendientes],
  ];
  resumen.addRow(['Concepto', 'Valor']);
  estiloEncabezado(resumen.getRow(1));
  for (const [concepto, valor] of resumenRows) {
    const row = resumen.addRow([concepto, valor]);
    if (typeof valor === 'number' && !concepto.startsWith('Pedidos')) {
      row.getCell(2).numFmt = '#,##0';
    }
  }

  // Historial de pedidos del mismo rango (hoy / semana / mes)
  const sheetHistorial = wb.addWorksheet('Historial', {
    properties: { defaultColWidth: 14 },
  });
  sheetHistorial.mergeCells(1, 1, 1, 8);
  sheetHistorial.getCell(1, 1).value = `Historial de pedidos — ${periodoLabel}`;
  sheetHistorial.getCell(1, 1).font = { bold: true, size: 12 };
  const pedidosHeaders = [
    'Fecha',
    'Hora',
    '#Pedido',
    'Cliente',
    'Total',
    'Medio',
    'Estado',
    'Indicaciones',
  ];
  sheetHistorial.addRow(pedidosHeaders);
  estiloEncabezado(sheetHistorial.getRow(2));
  sheetHistorial.getColumn(4).width = 18;
  sheetHistorial.getColumn(8).width = 28;
  sheetHistorial.getColumn(5).numFmt = '#,##0';

  for (const p of pedidos) {
    const { fecha, hora } = formatFechaHoraBogota(p.created_at);
    const row = sheetHistorial.addRow([
      fecha,
      hora,
      p.id,
      p.nombre_cliente,
      p.total,
      medioPago(p),
      p.estado === 'pagado' ? 'Pagado' : 'Pendiente',
      p.indicaciones ?? '',
    ]);
    row.getCell(5).numFmt = '#,##0';
  }
  // AutoFilter en fila de encabezados (fila 2); congelar título + header
  aplicarTablaConFiltros(sheetHistorial, 2, pedidosHeaders.length, pedidos.length);
  sheetHistorial.views = [{ state: 'frozen', ySplit: 2 }];

  const sheetEgresos = wb.addWorksheet('Egresos', {
    properties: { defaultColWidth: 14 },
  });
  sheetEgresos.mergeCells(1, 1, 1, 6);
  sheetEgresos.getCell(1, 1).value = `Egresos — ${periodoLabel}`;
  sheetEgresos.getCell(1, 1).font = { bold: true, size: 12 };
  const egresosHeaders = [
    'Fecha',
    'Hora',
    'Nombre',
    'Precio unit.',
    'Cantidad',
    'Total',
  ];
  sheetEgresos.addRow(egresosHeaders);
  estiloEncabezado(sheetEgresos.getRow(2));
  sheetEgresos.getColumn(3).width = 24;

  for (const e of egresos) {
    const { fecha, hora } = formatFechaHoraBogota(e.created_at);
    const row = sheetEgresos.addRow([
      fecha,
      hora,
      e.nombre,
      e.precio,
      e.cantidad,
      e.total,
    ]);
    row.getCell(4).numFmt = '#,##0';
    row.getCell(5).numFmt = '0.##';
    row.getCell(6).numFmt = '#,##0';
  }
  aplicarTablaConFiltros(sheetEgresos, 2, egresosHeaders.length, egresos.length);
  sheetEgresos.views = [{ state: 'frozen', ySplit: 2 }];

  const buffer = Buffer.from(await wb.xlsx.writeBuffer());
  return {
    buffer,
    filename: nombreArchivoBalance(balance),
    contentType: XLSX_MIME,
  };
}
