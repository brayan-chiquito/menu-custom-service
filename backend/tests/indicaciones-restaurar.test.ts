import { describe, expect, it } from 'vitest';
import { formatearMensajePedido } from '../src/modules/notificaciones/notificador.interface.js';
import { normalizarIndicaciones } from '../src/modules/pedidos/pedidos.service.js';
import request from 'supertest';
import { afterEach, beforeEach } from 'vitest';
import { createApp } from '../src/app.js';
import { createDatabase, type AppDatabase } from '../src/shared/db.js';
import { seedMenu } from '../src/seed/seed.js';
import { FakeNotificador } from '../src/modules/notificaciones/fake.notificador.js';

describe('indicaciones helpers', () => {
  it('should normalize empty to null', () => {
    expect(normalizarIndicaciones('  ')).toBeNull();
    expect(normalizarIndicaciones(null)).toBeNull();
    expect(normalizarIndicaciones('Sin chicharrón')).toBe('Sin chicharrón');
  });

  it('should include Indicaciones line in WhatsApp message only when set', () => {
    const base = {
      id: 1,
      nombre_cliente: 'Mauricio',
      total: 12000,
      monto_pagado: 12000,
      vuelto: 0,
      estado: 'pagado',
      items: [
        {
          producto_nombre: 'Candente',
          cantidad: 1,
          base_nombre: 'Verde',
          salsa_nombres: ['Ajo'],
          proteina_nombre: 'Carne',
          adiciones_nombres: [],
        },
      ],
    };
    const sin = formatearMensajePedido({ ...base, indicaciones: null });
    expect(sin).not.toContain('Indicaciones:');
    const con = formatearMensajePedido({ ...base, indicaciones: 'Sin chicharrón · +maíz' });
    expect(con).toContain('Indicaciones: Sin chicharrón · +maíz');
    expect(con).toContain('Cliente: Mauricio');
  });
});

describe('indicaciones + restaurar eliminados', () => {
  let db: AppDatabase;

  beforeEach(() => {
    db = createDatabase(':memory:');
    seedMenu(db);
  });

  afterEach(() => {
    db.close();
  });

  it('should persist indicaciones and soft-delete then restore', async () => {
    const app = createApp(db, new FakeNotificador());
    const menu = await request(app).get('/menu');
    const quesudo = menu.body.productos.find((p: { nombre: string }) => p.nombre === 'Quesudo');
    const base = menu.body.bases[0];
    const salsa = menu.body.salsas[0];

    const creado = await request(app)
      .post('/pedidos')
      .send({
        nombre_cliente: 'Mauricio',
        indicaciones: 'Sin chicharrón · +maíz',
        items: [
          {
            producto_id: quesudo.id,
            cantidad: 1,
            base_id: base.id,
            salsa_ids: [salsa.id],
            adiciones: [],
          },
        ],
      });
    expect(creado.status).toBe(201);
    expect(creado.body.indicaciones).toBe('Sin chicharrón · +maíz');

    const det = await request(app).get(`/pedidos/${creado.body.id}`);
    expect(det.body.indicaciones).toBe('Sin chicharrón · +maíz');

    await request(app).delete(`/pedidos/${creado.body.id}`).expect(204);

    const activos = await request(app).get('/pedidos?limit=50&offset=0');
    expect(activos.body.items.some((p: { id: number }) => p.id === creado.body.id)).toBe(false);

    const eliminados = await request(app).get('/pedidos?limit=50&offset=0&eliminados=1');
    expect(eliminados.body.items.some((p: { id: number }) => p.id === creado.body.id)).toBe(true);

    const rest = await request(app).patch(`/pedidos/${creado.body.id}/restaurar`);
    expect(rest.status).toBe(200);
    expect(rest.body.indicaciones).toBe('Sin chicharrón · +maíz');

    const activos2 = await request(app).get('/pedidos?limit=50&offset=0');
    expect(activos2.body.items.some((p: { id: number }) => p.id === creado.body.id)).toBe(true);
  });

  it('should be schema v7 with indicaciones column', () => {
    const version = db
      .prepare(`SELECT MAX(version) AS v FROM schema_migrations`)
      .get() as { v: number };
    expect(version.v).toBe(7);
    const cols = db.prepare(`PRAGMA table_info(pedidos)`).all() as Array<{ name: string }>;
    expect(cols.some((c) => c.name === 'indicaciones')).toBe(true);
  });
});
