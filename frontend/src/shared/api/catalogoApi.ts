import { apiFetch } from './client';

export type CatalogoProducto = {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  disponible: boolean;
  requiere_proteina: boolean;
};

export type CatalogoAdicion = {
  id: number;
  nombre: string;
  precio: number;
  producto_id: number | null;
};

export type CatalogoNombre = {
  id: number;
  nombre: string;
};

export function fetchCatalogoProductos(): Promise<CatalogoProducto[]> {
  return apiFetch('/catalogo/productos');
}

export function fetchCatalogoProducto(id: number): Promise<CatalogoProducto> {
  return apiFetch(`/catalogo/productos/${id}`);
}

export function createCatalogoProducto(body: {
  nombre: string;
  descripcion?: string;
  precio: number;
  categoria: 'platos' | 'bebidas';
  disponible?: boolean;
  requiere_proteina?: boolean;
}): Promise<CatalogoProducto> {
  return apiFetch('/catalogo/productos', { method: 'POST', body: JSON.stringify(body) });
}

export function updateCatalogoProducto(
  id: number,
  body: Partial<{
    nombre: string;
    descripcion: string;
    precio: number;
    categoria: 'platos' | 'bebidas';
    disponible: boolean;
    requiere_proteina: boolean;
  }>,
): Promise<CatalogoProducto> {
  return apiFetch(`/catalogo/productos/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export function deleteCatalogoProducto(id: number): Promise<void> {
  return apiFetch(`/catalogo/productos/${id}`, { method: 'DELETE' });
}

export function fetchCatalogoAdiciones(): Promise<CatalogoAdicion[]> {
  return apiFetch('/catalogo/adiciones');
}

export function fetchCatalogoAdicion(id: number): Promise<CatalogoAdicion> {
  return apiFetch(`/catalogo/adiciones/${id}`);
}

export function createCatalogoAdicion(body: {
  nombre: string;
  precio: number;
}): Promise<CatalogoAdicion> {
  return apiFetch('/catalogo/adiciones', { method: 'POST', body: JSON.stringify(body) });
}

export function updateCatalogoAdicion(
  id: number,
  body: Partial<{ nombre: string; precio: number }>,
): Promise<CatalogoAdicion> {
  return apiFetch(`/catalogo/adiciones/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export function deleteCatalogoAdicion(id: number): Promise<void> {
  return apiFetch(`/catalogo/adiciones/${id}`, { method: 'DELETE' });
}

type NombreRecurso = 'bases' | 'salsas' | 'proteinas';

export function fetchCatalogoNombres(recurso: NombreRecurso): Promise<CatalogoNombre[]> {
  return apiFetch(`/catalogo/${recurso}`);
}

export function fetchCatalogoNombre(recurso: NombreRecurso, id: number): Promise<CatalogoNombre> {
  return apiFetch(`/catalogo/${recurso}/${id}`);
}

export function createCatalogoNombre(
  recurso: NombreRecurso,
  body: { nombre: string },
): Promise<CatalogoNombre> {
  return apiFetch(`/catalogo/${recurso}`, { method: 'POST', body: JSON.stringify(body) });
}

export function updateCatalogoNombre(
  recurso: NombreRecurso,
  id: number,
  body: { nombre: string },
): Promise<CatalogoNombre> {
  return apiFetch(`/catalogo/${recurso}/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export function deleteCatalogoNombre(recurso: NombreRecurso, id: number): Promise<void> {
  return apiFetch(`/catalogo/${recurso}/${id}`, { method: 'DELETE' });
}
