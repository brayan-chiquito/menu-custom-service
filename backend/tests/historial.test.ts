import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { createDatabase, type AppDatabase } from '../src/shared/db.js';
import { seedMenu } from '../src/seed/seed.js';
import { FakeNotificador } from '../src/modules/notificaciones/fake.notificador.js';

describe('GET /pedidos?fecha=hoy', () => {
  let db: AppDatabase;
  let ids: {
    producto: number;
    base: number;
    salsa: number;
  };

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

  it('should return empty array when there are no pedidos today', async () => {
    const app = createApp(db, new FakeNotificador());

    const response = await request(app).get('/pedidos').query({ fecha: 'hoy' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('should return pedidos created today', async () => {
    const app = createApp(db, new FakeNotificador());

    const creado = await request(app)
      .post('/pedidos')
      .send({
        nombre_cliente: 'Luis',
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

    const response = await request(app).get('/pedidos').query({ fecha: 'hoy' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      id: creado.body.id,
      nombre_cliente: 'Luis',
      total: creado.body.total,
      monto_pagado: null,
      vuelto: null,
      estado: 'pendiente',
    });
    expect(response.body[0].created_at).toBeTruthy();
    expect(response.body[0].items).toBeUndefined();
  });

  it('should not return pedidos from other days', async () => {
    const app = createApp(db, new FakeNotificador());

    const creado = await request(app)
      .post('/pedidos')
      .send({
        nombre_cliente: 'Ayer',
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

    db.prepare(`UPDATE pedidos SET created_at = datetime('now', '-1 day') WHERE id = ?`).run(
      creado.body.id,
    );

    const response = await request(app).get('/pedidos').query({ fecha: 'hoy' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });
});
