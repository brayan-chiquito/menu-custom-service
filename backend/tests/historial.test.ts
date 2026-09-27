import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { createDatabase, type AppDatabase } from '../src/shared/db.js';
import { seedMenu } from '../src/seed/seed.js';
import { FakeNotificador } from '../src/modules/notificaciones/fake.notificador.js';

describe('GET /pedidos historial', () => {
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

  async function crear(app: ReturnType<typeof createApp>, nombre: string) {
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
    return response.body as { id: number; total: number; es_transferencia: boolean };
  }

  it('should return empty array for fecha=hoy when none today', async () => {
    const app = createApp(db, new FakeNotificador());
    const response = await request(app).get('/pedidos').query({ fecha: 'hoy' });
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('should return pedidos created today (Bogotá) for fecha=hoy', async () => {
    const app = createApp(db, new FakeNotificador());
    const creado = await crear(app, 'Luis');
    const response = await request(app).get('/pedidos').query({ fecha: 'hoy' });
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      id: creado.id,
      nombre_cliente: 'Luis',
      estado: 'pendiente',
      es_transferencia: false,
    });
  });

  it('should paginate all pedidos 10 by 10', async () => {
    const app = createApp(db, new FakeNotificador());
    for (let i = 0; i < 12; i += 1) {
      await crear(app, `Cliente ${i}`);
    }

    const page1 = await request(app).get('/pedidos').query({ limit: 10, offset: 0 });
    expect(page1.status).toBe(200);
    expect(page1.body.items).toHaveLength(10);
    expect(page1.body.total).toBe(12);
    expect(page1.body.has_more).toBe(true);

    const page2 = await request(app).get('/pedidos').query({ limit: 10, offset: 10 });
    expect(page2.status).toBe(200);
    expect(page2.body.items).toHaveLength(2);
    expect(page2.body.has_more).toBe(false);
  });

  it('should include older pedidos in paginated list', async () => {
    const app = createApp(db, new FakeNotificador());
    const viejo = await crear(app, 'Ayer');
    db.prepare(`UPDATE pedidos SET created_at = datetime('now', '-1 day') WHERE id = ?`).run(
      viejo.id,
    );
    await crear(app, 'Hoy');

    const hoy = await request(app).get('/pedidos').query({ fecha: 'hoy' });
    expect(hoy.body).toHaveLength(1);
    expect(hoy.body[0].nombre_cliente).toBe('Hoy');

    const todos = await request(app).get('/pedidos').query({ limit: 10, offset: 0 });
    expect(todos.body.total).toBe(2);
    expect(todos.body.items.map((p: { nombre_cliente: string }) => p.nombre_cliente)).toEqual([
      'Hoy',
      'Ayer',
    ]);
  });

  it('should filter by estado server-side', async () => {
    const app = createApp(db, new FakeNotificador());
    const a = await crear(app, 'Pendiente');
    const b = await crear(app, 'Pagado');
    await request(app).patch(`/pedidos/${b.id}/pago`).send({ monto_pagado: b.total });
    await request(app).patch(`/pedidos/${b.id}/confirmar`);

    const pendientes = await request(app)
      .get('/pedidos')
      .query({ limit: 10, offset: 0, estado: 'pendiente' });
    expect(pendientes.body.total).toBe(1);
    expect(pendientes.body.items[0].id).toBe(a.id);

    const pagados = await request(app)
      .get('/pedidos')
      .query({ limit: 10, offset: 0, estado: 'pagado' });
    expect(pagados.body.total).toBe(1);
    expect(pagados.body.items[0].es_transferencia).toBe(false);
  });
});
