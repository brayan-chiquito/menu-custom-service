/** Helpers de formulario de producto (categoría + toggles). */
export function resolveRequiereProteina(
  categoria: 'platos' | 'bebidas',
  requiereProteina: boolean,
): boolean {
  if (categoria === 'bebidas') {
    return false;
  }
  return requiereProteina;
}

export function canSaveProducto(input: {
  nombre: string;
  precio: number;
  guardando?: boolean;
}): boolean {
  return (
    input.nombre.trim().length > 0 &&
    Number.isFinite(input.precio) &&
    input.precio >= 0 &&
    !input.guardando
  );
}
