import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { createDatabase, type AppDatabase } from '../src/shared/db.js';
import { seedMenu } from '../src/seed/seed.js';
import { FakeNotificador } from '../src/modules/notificaciones/fake.notificador.js';

describe('pedidos conflicto updated_at', () => {
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

  it('should return 409 when updated_at is stale', async () => {
    const app = createApp(db, new FakeNotificador());

    const creado = await request(app)
      .post('/pedidos')
      .send({
        nombre_cliente: 'Conflicto',
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
    const id = creado.body.id as number;
    const updatedAt = creado.body.updated_at as string;
    expect(updatedAt).toBeTruthy();

    const ok = await request(app)
      .patch(`/pedidos/${id}`)
      .send({ nombre_cliente: 'Primero', updated_at: updatedAt });
    expect(ok.status).toBe(200);
    expect(ok.body.nombre_cliente).toBe('Primero');

    const conflict = await request(app)
      .patch(`/pedidos/${id}`)
      .send({ nombre_cliente: 'Segundo', updated_at: '2000-01-01 00:00:00' });
    expect(conflict.status).toBe(409);
    expect(conflict.body.error).toBe(
      'Otro usuario actualizó este pedido. Recarga e intenta de nuevo.',
    );
  });
});
