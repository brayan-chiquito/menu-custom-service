import { apiFetch } from './client';
import type { Egreso, PeriodoBalance } from './types';

export function crearEgreso(input: {
  nombre: string;
  precio: number;
  cantidad: number;
}): Promise<Egreso> {
  return apiFetch<Egreso>('/egresos', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function fetchEgresos(periodo: PeriodoBalance): Promise<Egreso[]> {
  return apiFetch<Egreso[]>(`/egresos?periodo=${periodo}`);
}
