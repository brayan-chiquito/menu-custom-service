import { describe, expect, it } from 'vitest';
import { formatearMetaHistorial } from './historial.format';

describe('formatearMetaHistorial', () => {
  it('should show only time when same Bogotá day', () => {
    const ahora = new Date(Date.UTC(2026, 8, 19, 20, 0, 0)); // 15:00 Bogotá
    const created = '2026-09-19 18:30:00'; // 13:30 Bogotá
    expect(formatearMetaHistorial(8, created, ahora)).toMatch(/^#8 · /);
    expect(formatearMetaHistorial(8, created, ahora)).not.toMatch(/sep/);
  });

  it('should include day month when different Bogotá day', () => {
    const ahora = new Date(Date.UTC(2026, 8, 20, 17, 0, 0)); // 20 sep Bogotá
    const created = '2026-09-19 20:30:00'; // 19 sep 15:30 Bogotá
    expect(formatearMetaHistorial(8, created, ahora)).toMatch(/#8 · 19 sep ·/);
  });
});
