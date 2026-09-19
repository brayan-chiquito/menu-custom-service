import { apiFetch } from './client';
import type { MenuResponse } from './types';

export function fetchMenu(): Promise<MenuResponse> {
  return apiFetch<MenuResponse>('/menu');
}
