import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { createDatabase, type AppDatabase } from '../src/shared/db.js';
import { seedMenu } from '../src/seed/seed.js';
import { FakeNotificador } from '../src/modules/notificaciones/fake.notificador.js';

describe('cocina cola + preparar', () => {
  let db: AppDatabase;
  let ids: { producto: number; base: number; salsa: number; carne: number };

  beforeEach(() => {
    db = createDatabase(':memory:');
    seedMenu(db);
    ids = {
      producto: (
        db.prepare(`SELECT id FROM productos WHERE nombre = 'Candente'`).get() as { id: number }
      ).id,
      base: (db.prepare(`SELECT id FROM bases WHERE nombre = 'Maduro'`).get() as { id: number }).id,
      salsa: (db.prepare(`SELECT id FROM salsas WHERE nombre = 'BBQ'`).get() as { id: number }).id,
      carne: (
        db.prepare(`SELECT id FROM proteinas WHERE nombre = 'Carne'`).get() as { id: number }
      ).id,
    };
  });

  afterEach(() => {
    db.close();
  });

  it('should list pending pedido in cocina and remove after preparar without changing pago estado', async () => {
    const app = createApp(db, new FakeNotificador());

    const creado = await request(app)
      .post('/pedidos')
      .send({
        nombre_cliente: 'Cocina Test',
        items: [
          {
            producto_id: ids.producto,
            cantidad: 1,
            base_id: ids.base,
            salsa_ids: [ids.salsa],
            proteina_id: ids.carne,
            adiciones: [],
          },
        ],
      });
    expect(creado.status).toBe(201);
    const pedidoId = creado.body.id as number;
    expect(creado.body.estado).toBe('pendiente');
    expect(creado.body.preparado_at).toBeNull();

    const cola1 = await request(app).get('/cocina');
    expect(cola1.status).toBe(200);
    expect(cola1.body.some((p: { id: number }) => p.id === pedidoId)).toBe(true);

    const listo = await request(app).patch(`/pedidos/${pedidoId}/preparar`);
    expect(listo.status).toBe(200);
    expect(listo.body.estado).toBe('pendiente');
    expect(listo.body.preparado_at).toBeTruthy();

    const cola2 = await request(app).get('/cocina');
    expect(cola2.body.some((p: { id: number }) => p.id === pedidoId)).toBe(false);

    const detalle = await request(app).get(`/pedidos/${pedidoId}`);
    expect(detalle.body.estado).toBe('pendiente');
    expect(detalle.body.preparado_at).toBeTruthy();
  });
});
