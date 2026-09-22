/** Total de egreso = precio × cantidad (RF-14). */
export function calcularTotalEgreso(precio: number, cantidad: number): number {
  return Math.round(precio * cantidad);
}
