import { describe, expect, it } from 'vitest';
import type { AuditoriaEntry } from '../../shared/api/authTypes';
import { formatearFilaAuditoria } from './seguimiento.format';

function entry(partial: Partial<AuditoriaEntry>): AuditoriaEntry {
  return {
    id: 1,
    usuario_id: 1,
    usuario: 'admin',
    nombre: 'Administrador',
    accion: 'login',
    entidad: 'sesion',
    entidad_id: null,
    detalle: null,
    created_at: '2026-03-21 15:30:00',
    ...partial,
  };
}

describe('formatearFilaAuditoria', () => {
  it('should prefer nombre visible over login when both exist', () => {
    const row = formatearFilaAuditoria(entry({}));
    expect(row.quien).toBe('Administrador');
    expect(row.que).toBe('login · sesion');
  });

  it('should include entidad_id when present and fallback quien to Sistema', () => {
    const row = formatearFilaAuditoria(
      entry({
        nombre: null,
        usuario: null,
        accion: 'crear',
        entidad: 'pedido',
        entidad_id: '42',
      }),
    );
    expect(row.quien).toBe('Sistema');
    expect(row.que).toBe('crear · pedido #42');
  });
});
