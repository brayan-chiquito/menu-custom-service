import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { createDatabase, type AppDatabase } from '../src/shared/db.js';
import { seedMenu } from '../src/seed/seed.js';
import { FakeNotificador } from '../src/modules/notificaciones/fake.notificador.js';
import { ajustarPagoTrasEditar } from '../src/modules/pedidos/pedidos.service.js';

describe('ajustarPagoTrasEditar', () => {
  it('should null pago for pendiente', () => {
    expect(
      ajustarPagoTrasEditar({
        estado: 'pendiente',
        es_transferencia: false,
        monto_pagado: null,
        totalAnterior: 10000,
        totalNuevo: 12000,
      }),
    ).toEqual({ monto_pagado: null, vuelto: null });
  });

  it('should set monto=total for transferencia pagada', () => {
    expect(
      ajustarPagoTrasEditar({
        estado: 'pagado',
        es_transferencia: true,
        monto_pagado: 10000,
        totalAnterior: 10000,
        totalNuevo: 15000,
      }),
    ).toEqual({ monto_pagado: 15000, vuelto: 0 });
  });

  it('should bump monto when efectivo below new total', () => {
    expect(
      ajustarPagoTrasEditar({
        estado: 'pagado',
        es_transferencia: false,
        monto_pagado: 10000,
        totalAnterior: 10000,
        totalNuevo: 12000,
      }),
    ).toEqual({ monto_pagado: 12000, vuelto: 0 });
  });

  it('should keep monto and recompute vuelto when still enough', () => {
    expect(
      ajustarPagoTrasEditar({
        estado: 'pagado',
        es_transferencia: false,
        monto_pagado: 20000,
        totalAnterior: 10000,
        totalNuevo: 12000,
      }),
    ).toEqual({ monto_pagado: 20000, vuelto: 8000 });
  });
});

describe('PATCH/DELETE /pedidos/:id (soft-delete + editar)', () => {
  let db: AppDatabase;

  beforeEach(() => {
    db = createDatabase(':memory:');
    seedMenu(db);
  });

  afterEach(() => {
    db.close();
  });

  async function crearYPagar(app: ReturnType<typeof createApp>, nombre: string) {
    const productos = await request(app).get('/menu');
    const quesudo = productos.body.productos.find((p: { nombre: string }) => p.nombre === 'Quesudo');
    const base = productos.body.bases[0];
    const salsa = productos.body.salsas[0];

    const creado = await request(app)
      .post('/pedidos')
      .send({
        nombre_cliente: nombre,
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

    await request(app)
      .patch(`/pedidos/${creado.body.id}/pago`)
      .send({ monto_pagado: creado.body.total });
    await request(app).patch(`/pedidos/${creado.body.id}/confirmar`);
    return creado.body as { id: number; total: number };
  }

  it('should soft-delete and hide from list and balance', async () => {
    const app = createApp(db, new FakeNotificador());
    const pedido = await crearYPagar(app, 'Borrar');

    const del = await request(app).delete(`/pedidos/${pedido.id}`);
    expect(del.status).toBe(204);

    const get = await request(app).get(`/pedidos/${pedido.id}`);
    expect(get.status).toBe(200);
    expect(get.body.eliminado_at).toBeTruthy();

    const lista = await request(app).get('/pedidos?limit=50&offset=0');
    expect(lista.body.items.some((p: { id: number }) => p.id === pedido.id)).toBe(false);

    const bal = await request(app).get('/pedidos/balance?periodo=hoy');
    expect(bal.body.pedidos_pagados).toBe(0);

    const row = db.prepare(`SELECT eliminado_at FROM pedidos WHERE id = ?`).get(pedido.id) as {
      eliminado_at: string | null;
    };
    expect(row.eliminado_at).toBeTruthy();
  });

  it('should edit nombre and items on pagado order', async () => {
    const app = createApp(db, new FakeNotificador());
    const pedido = await crearYPagar(app, 'Ana');
    const menu = await request(app).get('/menu');
    const quesudo = menu.body.productos.find((p: { nombre: string }) => p.nombre === 'Quesudo');
    const base = menu.body.bases[0];
    const salsa = menu.body.salsas[1] ?? menu.body.salsas[0];

    const patch = await request(app)
      .patch(`/pedidos/${pedido.id}`)
      .send({
        nombre_cliente: 'Ana Editada',
        items: [
          {
            producto_id: quesudo.id,
            cantidad: 2,
            base_id: base.id,
            salsa_ids: [salsa.id],
            adiciones: [],
          },
        ],
      });

    expect(patch.status).toBe(200);
    expect(patch.body.nombre_cliente).toBe('Ana Editada');
    expect(patch.body.total).toBe(pedido.total * 2);
    expect(patch.body.estado).toBe('pagado');
    expect(patch.body.lineas).toHaveLength(1);
    expect(patch.body.lineas[0].cantidad).toBe(2);
    expect(patch.body.monto_pagado).toBe(patch.body.total);
    expect(patch.body.vuelto).toBe(0);
  });

  it('should migrate schema to v6 with eliminado_at', () => {
    const version = db
      .prepare(`SELECT MAX(version) AS v FROM schema_migrations`)
      .get() as { v: number };
    expect(version.v).toBe(7);
    const cols = db.prepare(`PRAGMA table_info(pedidos)`).all() as Array<{ name: string }>;
    expect(cols.some((c) => c.name === 'eliminado_at')).toBe(true);
  });
});
