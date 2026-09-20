/** Reglas de “puede agregar” del modal (platos vs bebidas). */
export function puedeAgregarProducto(input: {
  categoria: string;
  baseId: number | null;
  salsaIds: number[];
  proteinaId: number | null;
  requiere_proteina: boolean;
}): boolean {
  if (input.categoria === 'bebidas') {
    return true;
  }
  if (input.baseId === null) {
    return false;
  }
  if (input.requiere_proteina && input.proteinaId === null) {
    return false;
  }
  return true;
}
