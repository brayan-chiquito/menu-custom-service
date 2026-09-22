import { describe, expect, it } from 'vitest';
import { ApiError } from '../api/client';
import { mensajeErrorUsuario } from './mensajeErrorUsuario';

describe('mensajeErrorUsuario', () => {
  it('should map network failures to Spanish copy', () => {
    const net = mensajeErrorUsuario(new TypeError('Failed to fetch'), 'No se pudo guardar');
    expect(net.title).toBe('No se pudo guardar');
    expect(net.message).toMatch(/Sin conexión/i);

    const status0 = mensajeErrorUsuario(
      new ApiError('x', 0),
      'No se pudo confirmar el pago',
    );
    expect(status0.message).toMatch(/Sin conexión/i);
  });

  it('should keep clear API error messages', () => {
    const r = mensajeErrorUsuario(
      new ApiError('El pedido debe incluir al menos un item', 400),
      'No se pudo crear el pedido',
    );
    expect(r.message).toBe('El pedido debe incluir al menos un item');
  });

  it('should soften opaque HTTP messages', () => {
    const r = mensajeErrorUsuario(
      new ApiError('HTTP 500 en /pedidos', 500),
      'No se pudo confirmar el pago',
    );
    expect(r.message).toMatch(/servidor/i);
  });
});
