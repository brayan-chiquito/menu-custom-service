import type { PedidoDetalleLinea } from '../../shared/api/types';

export function formatearLineaDetalle(linea: PedidoDetalleLinea): string {
  const partes: string[] = [];
  if (linea.base_nombre) {
    partes.push(linea.base_nombre);
  }
  if (linea.salsa_nombres.length > 0) {
    partes.push(linea.salsa_nombres.join(', '));
  }
  if (linea.proteina_nombre) {
    partes.push(linea.proteina_nombre);
  }
  if (linea.adiciones.length > 0) {
    partes.push(linea.adiciones.map((a) => a.nombre).join(', '));
  }
  return partes.join(' · ');
}
