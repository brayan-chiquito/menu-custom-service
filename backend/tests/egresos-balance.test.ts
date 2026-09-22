import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { createDatabase, type AppDatabase } from '../src/shared/db.js';
import { seedMenu } from '../src/seed/seed.js';
import { FakeNotificador } from '../src/modules/notificaciones/fake.notificador.js';

describe('egresos + balance con transferencia', () => {
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

  async function crearYPagar(
    app: ReturnType<typeof createApp>,
    nombre: string,
    transferencia: boolean,
  ) {
    const creado = await request(app)
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
    expect(creado.status).toBe(201);
    const pago = await request(app)
      .patch(`/pedidos/${creado.body.id}/pago`)
      .send({ monto_pagado: creado.body.total, es_transferencia: transferencia });
    expect(pago.status).toBe(200);
    expect(pago.body.es_transferencia).toBe(transferencia);
    const conf = await request(app).patch(`/pedidos/${creado.body.id}/confirmar`);
    expect(conf.status).toBe(200);
    return creado.body.total as number;
  }

  it('should create egreso and list by periodo', async () => {
    const app = createApp(db, new FakeNotificador());
    const creado = await request(app)
      .post('/egresos')
      .send({ nombre: 'Plátano', precio: 2000, cantidad: 3 });
    expect(creado.status).toBe(201);
    expect(creado.body).toMatchObject({ nombre: 'Plátano', precio: 2000, cantidad: 3, total: 6000 });

    const lista = await request(app).get('/egresos').query({ periodo: 'hoy' });
    expect(lista.status).toBe(200);
    expect(lista.body).toHaveLength(1);
  });

  it('should split balance by efectivo/transferencia and subtract gastos', async () => {
    const app = createApp(db, new FakeNotificador());
    const tEfectivo = await crearYPagar(app, 'Efectivo', false);
    const tTransfer = await crearYPagar(app, 'Transfer', true);
    await request(app).post('/egresos').send({ nombre: 'Aceite', precio: 5000, cantidad: 1 });

    const balance = await request(app).get('/pedidos/balance').query({ periodo: 'hoy' });
    expect(balance.status).toBe(200);
    expect(balance.body.cobrado).toBe(tEfectivo + tTransfer);
    expect(balance.body.cobrado_efectivo).toBe(tEfectivo);
    expect(balance.body.cobrado_transferencia).toBe(tTransfer);
    expect(balance.body.pedidos_efectivo).toBe(1);
    expect(balance.body.pedidos_transferencia).toBe(1);
    expect(balance.body.gastos).toBe(5000);
    expect(balance.body.ganancia).toBe(tEfectivo + tTransfer - 5000);
  });
});
