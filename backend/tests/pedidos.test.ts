import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { createDatabase, type AppDatabase } from '../src/shared/db.js';
import { seedMenu } from '../src/seed/seed.js';
import { FakeNotificador } from '../src/modules/notificaciones/fake.notificador.js';
import { calcularTotal, normalizarNombreCliente } from '../src/modules/pedidos/pedidos.service.js';

describe('POST /pedidos', () => {
  let db: AppDatabase;
  let ids: {
    candente: number;
    apoteosico: number;
    base: number;
    salsa: number;
    carne: number;
    guacamole: number;
  };

  beforeEach(() => {
    db = createDatabase(':memory:');
    seedMenu(db);

    ids = {
      candente: (
        db.prepare(`SELECT id FROM productos WHERE nombre = 'Candente'`).get() as { id: number }
      ).id,
      apoteosico: (
        db.prepare(`SELECT id FROM productos WHERE nombre = 'Apoteósico'`).get() as { id: number }
      ).id,
      base: (db.prepare(`SELECT id FROM bases WHERE nombre = 'Maduro'`).get() as { id: number }).id,
      salsa: (db.prepare(`SELECT id FROM salsas WHERE nombre = 'BBQ'`).get() as { id: number }).id,
      carne: (
        db.prepare(`SELECT id FROM proteinas WHERE nombre = 'Carne'`).get() as { id: number }
      ).id,
      guacamole: (
        db.prepare(`SELECT id FROM adiciones WHERE nombre = 'Guacamole'`).get() as { id: number }
      ).id,
    };
  });

  afterEach(() => {
    db.close();
  });

  it('should create pedido with base, salsa, proteina and frozen prices', async () => {
    const app = createApp(db, new FakeNotificador());

    const response = await request(app)
      .post('/pedidos')
      .send({
        nombre_cliente: '',
        items: [
          {
            producto_id: ids.candente,
            cantidad: 2,
            base_id: ids.base,
            salsa_ids: [ids.salsa],
            proteina_id: ids.carne,
            adiciones: [ids.guacamole],
          },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      nombre_cliente: 'Sin nombre',
      total: 2 * (22000 + 2000),
      estado: 'pendiente',
    });
    expect(response.body.items[0]).toMatchObject({
      producto_id: ids.candente,
      base_id: ids.base,
      salsa_ids: [ids.salsa],
      proteina_id: ids.carne,
      precio_unit_momento: 22000,
    });
  });

  it('should require proteina only when producto.requiere_proteina', async () => {
    const app = createApp(db, new FakeNotificador());

    const sinProteina = await request(app)
      .post('/pedidos')
      .send({
        items: [
          {
            producto_id: ids.candente,
            cantidad: 1,
            base_id: ids.base,
            salsa_ids: [ids.salsa],
            adiciones: [],
          },
        ],
      });
    expect(sinProteina.status).toBe(400);

    const apoteosicoConProteina = await request(app)
      .post('/pedidos')
      .send({
        items: [
          {
            producto_id: ids.apoteosico,
            cantidad: 1,
            base_id: ids.base,
            salsa_ids: [ids.salsa],
            proteina_id: ids.carne,
            adiciones: [],
          },
        ],
      });
    expect(apoteosicoConProteina.status).toBe(400);

    const apoteosicoOk = await request(app)
      .post('/pedidos')
      .send({
        nombre_cliente: 'Ana',
        items: [
          {
            producto_id: ids.apoteosico,
            cantidad: 1,
            base_id: ids.base,
            salsa_ids: [ids.salsa],
            proteina_id: null,
            adiciones: [],
          },
        ],
      });
    expect(apoteosicoOk.status).toBe(201);
    expect(apoteosicoOk.body.items[0].proteina_id).toBeNull();
  });

  it('should reject missing base or salsa', async () => {
    const app = createApp(db, new FakeNotificador());

    const response = await request(app)
      .post('/pedidos')
      .send({
        items: [
          {
            producto_id: ids.apoteosico,
            cantidad: 1,
            salsa_ids: [ids.salsa],
            adiciones: [],
          },
        ],
      });

    expect(response.status).toBe(400);
  });

  it('should accept multiple salsa_ids on one item', async () => {
    const app = createApp(db, new FakeNotificador());
    const ajo = (db.prepare(`SELECT id FROM salsas WHERE nombre = 'Ajo'`).get() as { id: number })
      .id;
    const bbq = ids.salsa;

    const response = await request(app)
      .post('/pedidos')
      .send({
        items: [
          {
            producto_id: ids.apoteosico,
            cantidad: 1,
            base_id: ids.base,
            salsa_ids: [ajo, bbq],
            proteina_id: null,
            adiciones: [],
          },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body.items[0].salsa_ids).toEqual([ajo, bbq]);
  });

  it('should create bebida without base or salsa', async () => {
    const app = createApp(db, new FakeNotificador());
    const limonada = (
      db.prepare(`SELECT id FROM productos WHERE nombre = 'Limonada de coco'`).get() as {
        id: number;
      }
    ).id;

    const response = await request(app)
      .post('/pedidos')
      .send({
        nombre_cliente: 'Sed',
        items: [
          {
            producto_id: limonada,
            cantidad: 2,
            adiciones: [],
          },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body.total).toBe(6000);
    expect(response.body.items[0]).toMatchObject({
      producto_id: limonada,
      base_id: null,
      salsa_ids: [],
      proteina_id: null,
      precio_unit_momento: 3000,
    });
  });
});

describe('pedidos helpers', () => {
  it('should normalize empty names', () => {
    expect(normalizarNombreCliente('')).toBe('Sin nombre');
    expect(normalizarNombreCliente(' Juan ')).toBe('Juan');
  });

  it('should calculate totals', () => {
    expect(
      calcularTotal([
        {
          producto_id: 1,
          cantidad: 2,
          precio_unit_momento: 10000,
          base_id: 1,
          salsa_ids: [1],
          proteina_id: null,
          adiciones: [{ adicion_id: 1, precio_momento: 500 }],
        },
      ]),
    ).toBe(2 * 10500);
  });
});
