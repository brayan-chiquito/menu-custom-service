import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { createDatabase, type AppDatabase } from '../src/shared/db.js';
import { seedMenu } from '../src/seed/seed.js';
import type {
  Notificador,
  PedidoDTO,
  ResultadoNotificacion,
} from '../src/modules/notificaciones/notificador.interface.js';

class SpyNotificador implements Notificador {
  readonly enviados: PedidoDTO[] = [];
  failNext = false;

  async enviar(pedido: PedidoDTO): Promise<ResultadoNotificacion> {
    if (this.failNext) {
      this.failNext = false;
      throw new Error('Fallo simulado');
    }
    this.enviados.push(pedido);
    return { enviada: true };
  }
}

class FailSoftNotificador implements Notificador {
  async enviar(_pedido: PedidoDTO): Promise<ResultadoNotificacion> {
    return { enviada: false };
  }
}

describe('PATCH pago y confirmar', () => {
  let db: AppDatabase;
  let notificador: SpyNotificador;
  let pedidoId: number;

  beforeEach(async () => {
    db = createDatabase(':memory:');
    seedMenu(db);
    notificador = new SpyNotificador();

    const producto = db
      .prepare(`SELECT id FROM productos WHERE nombre = 'Quesudo'`)
      .get() as { id: number };
    const base = db.prepare(`SELECT id FROM bases WHERE nombre = 'Verde'`).get() as { id: number };
    const salsa = db.prepare(`SELECT id FROM salsas WHERE nombre = 'Ajo'`).get() as { id: number };

    const app = createApp(db, notificador);
    const creado = await request(app)
      .post('/pedidos')
      .send({
        nombre_cliente: 'Ana',
        items: [
          {
            producto_id: producto.id,
            cantidad: 1,
            base_id: base.id,
            salsa_ids: [salsa.id],
            adiciones: [],
          },
        ],
      });

    pedidoId = creado.body.id;
  });

  afterEach(() => {
    db.close();
  });

  it('should register payment with vuelto and keep pendiente', async () => {
    const app = createApp(db, notificador);
    const response = await request(app)
      .patch(`/pedidos/${pedidoId}/pago`)
      .send({ monto_pagado: 15000 });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      total: 10000,
      monto_pagado: 15000,
      vuelto: 5000,
      estado: 'pendiente',
    });
  });

  it('should reject insufficient payment', async () => {
    const app = createApp(db, notificador);
    const response = await request(app)
      .patch(`/pedidos/${pedidoId}/pago`)
      .send({ monto_pagado: 5000 });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ error: 'Monto insuficiente', faltante: 5000 });
  });

  it('should confirm with notificacion.enviada true and mensaje', async () => {
    const app = createApp(db, notificador);
    await request(app).patch(`/pedidos/${pedidoId}/pago`).send({ monto_pagado: 10000 });

    const ok = await request(app).patch(`/pedidos/${pedidoId}/confirmar`);
    expect(ok.status).toBe(200);
    expect(ok.body.estado).toBe('pagado');
    expect(ok.body.notificacion.enviada).toBe(true);
    expect(ok.body.notificacion.mensaje).toContain('Quesudo');
    expect(ok.body.notificacion.mensaje).toContain('base: Verde');
    expect(ok.body.notificacion.mensaje).toContain('Cliente: Ana');
    expect(notificador.enviados).toHaveLength(1);
  });

  it('should keep pagado and return enviada false when notifier fails', async () => {
    const app = createApp(db, notificador);
    await request(app).patch(`/pedidos/${pedidoId}/pago`).send({ monto_pagado: 10000 });
    notificador.failNext = true;

    const response = await request(app).patch(`/pedidos/${pedidoId}/confirmar`);

    expect(response.status).toBe(200);
    expect(response.body.estado).toBe('pagado');
    expect(response.body.notificacion.enviada).toBe(false);
    expect(response.body.notificacion.mensaje).toContain('Pedido #');
    expect(response.body.notificacion.mensaje).toContain('Quesudo');
  });

  it('should return enviada false when notifier soft-fails', async () => {
    const soft = new FailSoftNotificador();
    const app = createApp(db, soft);
    await request(app).patch(`/pedidos/${pedidoId}/pago`).send({ monto_pagado: 10000 });

    const response = await request(app).patch(`/pedidos/${pedidoId}/confirmar`);

    expect(response.status).toBe(200);
    expect(response.body.estado).toBe('pagado');
    expect(response.body.notificacion).toEqual({
      enviada: false,
      mensaje: expect.stringContaining('Total: $10000'),
    });
  });

  it('should get pedido by id while still pendiente', async () => {
    const app = createApp(db, notificador);
    const response = await request(app).get(`/pedidos/${pedidoId}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: pedidoId,
      nombre_cliente: 'Ana',
      estado: 'pendiente',
      monto_pagado: null,
      total: 10000,
    });
    expect(response.body.lineas).toHaveLength(1);
    expect(response.body.lineas[0]).toMatchObject({
      cantidad: 1,
      producto_nombre: 'Quesudo',
      base_nombre: 'Verde',
      salsa_nombres: ['Ajo'],
    });
    expect(response.body.lineas[0].subtotal).toBe(10000);
  });

  it('should allow pay+confirm later on a previously saved pendiente', async () => {
    const app = createApp(db, notificador);

    const listBefore = await request(app).get('/pedidos?fecha=hoy');
    expect(listBefore.body.some((p: { id: number; estado: string }) => p.id === pedidoId && p.estado === 'pendiente')).toBe(
      true,
    );

    await request(app).patch(`/pedidos/${pedidoId}/pago`).send({ monto_pagado: 12000 });
    const confirmado = await request(app).patch(`/pedidos/${pedidoId}/confirmar`);

    expect(confirmado.status).toBe(200);
    expect(confirmado.body.estado).toBe('pagado');
    expect(confirmado.body.vuelto).toBe(2000);
    expect(notificador.enviados).toHaveLength(1);
  });
});
