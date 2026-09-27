import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { createDatabase, type AppDatabase } from '../src/shared/db.js';
import { seedMenu } from '../src/seed/seed.js';
import { FakeNotificador } from '../src/modules/notificaciones/fake.notificador.js';

describe('GET /pedidos/balance', () => {
  let db: AppDatabase;
  let ids: { producto: number; base: number; salsa: number };

  beforeEach(() => {
    db = createDatabase(':memory:');
    seedMenu(db);
    ids = {
      producto: (
        db.prepare(`SELECT id FROM productos WHERE nombre = 'Quesudo'`).get() as { id: number }
      ).id,
      base: (db.prepare(`SELECT id FROM bases WHERE nombre = 'Verde'`).get() as { id: number }).id,
      salsa: (db.prepare(`SELECT id FROM salsas WHERE nombre = 'Ajo'`).get() as { id: number }).id,
    };
  });

  afterEach(() => {
    db.close();
  });

  async function crearPedido(app: ReturnType<typeof createApp>, nombre: string) {
    const response = await request(app)
      .post('/pedidos')
      .send({
        nombre_cliente: nombre,
        items: [
          {
            producto_id: ids.producto,
            cantidad: 1,
            base_id: ids.base,
            salsa_ids: [ids.salsa],
            adiciones: [],
          },
        ],
      });
    expect(response.status).toBe(201);
    return response.body as { id: number; total: number };
  }

  async function pagarYConfirmar(app: ReturnType<typeof createApp>, id: number, total: number) {
    const pago = await request(app).patch(`/pedidos/${id}/pago`).send({ monto_pagado: total });
    expect(pago.status).toBe(200);
    const conf = await request(app).patch(`/pedidos/${id}/confirmar`);
    expect(conf.status).toBe(200);
  }

  it('should reject invalid periodo', async () => {
    const app = createApp(db, new FakeNotificador());
    const response = await request(app).get('/pedidos/balance').query({ periodo: 'ano' });
    expect(response.status).toBe(400);
  });

  it('should return zeros when empty', async () => {
    const app = createApp(db, new FakeNotificador());
    const response = await request(app).get('/pedidos/balance').query({ periodo: 'hoy' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      periodo: 'hoy',
      cobrado: 0,
      cobrado_efectivo: 0,
      cobrado_transferencia: 0,
      pedidos_pagados: 0,
      pedidos_efectivo: 0,
      pedidos_transferencia: 0,
      ticket_promedio: 0,
      pendiente: 0,
      pedidos_pendientes: 0,
      gastos: 0,
      ganancia: 0,
    });
    expect(response.body.desde).toBeTruthy();
    expect(response.body.hasta).toBe(response.body.desde);
  });

  it('should separate cobrado and pendiente for hoy', async () => {
    const app = createApp(db, new FakeNotificador());
    const pagado = await crearPedido(app, 'Pagado');
    await pagarYConfirmar(app, pagado.id, pagado.total);
    const pendiente = await crearPedido(app, 'Pendiente');

    const response = await request(app).get('/pedidos/balance').query({ periodo: 'hoy' });

    expect(response.status).toBe(200);
    expect(response.body.cobrado).toBe(pagado.total);
    expect(response.body.pedidos_pagados).toBe(1);
    expect(response.body.ticket_promedio).toBe(pagado.total);
    expect(response.body.pendiente).toBe(pendiente.total);
    expect(response.body.pedidos_pendientes).toBe(1);
  });

  it('should include week range and exclude older pedidos', async () => {
    const app = createApp(db, new FakeNotificador());
    const deHoy = await crearPedido(app, 'Hoy');
    await pagarYConfirmar(app, deHoy.id, deHoy.total);

    const viejo = await crearPedido(app, 'Viejo');
    await pagarYConfirmar(app, viejo.id, viejo.total);
    db.prepare(`UPDATE pedidos SET created_at = datetime('now', '-20 days') WHERE id = ?`).run(
      viejo.id,
    );

    const response = await request(app).get('/pedidos/balance').query({ periodo: 'semana' });

    expect(response.status).toBe(200);
    expect(response.body.periodo).toBe('semana');
    expect(response.body.cobrado).toBe(deHoy.total);
    expect(response.body.pedidos_pagados).toBe(1);
  });

  it('should aggregate mes including earlier days this month', async () => {
    const app = createApp(db, new FakeNotificador());
    const reciente = await crearPedido(app, 'Reciente');
    await pagarYConfirmar(app, reciente.id, reciente.total);

    const delMes = await crearPedido(app, 'DelMes');
    await pagarYConfirmar(app, delMes.id, delMes.total);
    db.prepare(`UPDATE pedidos SET created_at = datetime('now', 'start of month', '+1 day') WHERE id = ?`).run(
      delMes.id,
    );

    const response = await request(app).get('/pedidos/balance').query({ periodo: 'mes' });

    expect(response.status).toBe(200);
    expect(response.body.periodo).toBe('mes');
    expect(response.body.cobrado).toBe(reciente.total + delMes.total);
    expect(response.body.pedidos_pagados).toBe(2);
  });
});
