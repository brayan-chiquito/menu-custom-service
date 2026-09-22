import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { createDatabase, type AppDatabase } from '../src/shared/db.js';
import { seedMenu } from '../src/seed/seed.js';
import { FakeNotificador } from '../src/modules/notificaciones/fake.notificador.js';

describe('CRUD /catalogo', () => {
  let db: AppDatabase;

  beforeEach(() => {
    db = createDatabase(':memory:');
    seedMenu(db);
  });

  afterEach(() => {
    db.close();
  });

  it('should create update and list producto with requiere_proteina toggle', async () => {
    const app = createApp(db, new FakeNotificador());

    const creado = await request(app).post('/catalogo/productos').send({
      nombre: 'Especial QA',
      descripcion: 'test',
      precio: 15000,
      categoria: 'platos',
      disponible: true,
      requiere_proteina: true,
    });
    expect(creado.status).toBe(201);
    expect(creado.body.requiere_proteina).toBe(true);

    const sinProt = await request(app)
      .patch(`/catalogo/productos/${creado.body.id}`)
      .send({ requiere_proteina: false });
    expect(sinProt.status).toBe(200);
    expect(sinProt.body.requiere_proteina).toBe(false);

    const lista = await request(app).get('/catalogo/productos');
    expect(lista.status).toBe(200);
    expect(lista.body.some((p: { nombre: string }) => p.nombre === 'Especial QA')).toBe(true);
  });

  it('should force requiere_proteina false for bebidas', async () => {
    const app = createApp(db, new FakeNotificador());
    const creado = await request(app).post('/catalogo/productos').send({
      nombre: 'Jugo QA',
      precio: 4000,
      categoria: 'bebidas',
      requiere_proteina: true,
    });
    expect(creado.status).toBe(201);
    expect(creado.body.requiere_proteina).toBe(false);
  });

  it('should CRUD toppings bases and salsas', async () => {
    const app = createApp(db, new FakeNotificador());

    const topping = await request(app)
      .post('/catalogo/adiciones')
      .send({ nombre: 'Extra queso QA', precio: 2500 });
    expect(topping.status).toBe(201);

    const base = await request(app).post('/catalogo/bases').send({ nombre: 'Base QA' });
    expect(base.status).toBe(201);

    const salsa = await request(app).post('/catalogo/salsas').send({ nombre: 'Salsa QA' });
    expect(salsa.status).toBe(201);

    const prot = await request(app).post('/catalogo/proteinas').send({ nombre: 'Cerdo QA' });
    expect(prot.status).toBe(201);

    await request(app).patch(`/catalogo/salsas/${salsa.body.id}`).send({ nombre: 'Salsa QA 2' });
    const salsas = await request(app).get('/catalogo/salsas');
    expect(salsas.body.some((s: { nombre: string }) => s.nombre === 'Salsa QA 2')).toBe(true);

    const delTopping = await request(app).delete(`/catalogo/adiciones/${topping.body.id}`);
    expect(delTopping.status).toBe(204);
  });

  it('should reject delete when referenced by pedido', async () => {
    const app = createApp(db, new FakeNotificador());
    const producto = (
      db.prepare(`SELECT id FROM productos WHERE nombre = 'Quesudo'`).get() as { id: number }
    ).id;
    const base = (db.prepare(`SELECT id FROM bases WHERE nombre = 'Verde'`).get() as { id: number })
      .id;

    const pedido = await request(app)
      .post('/pedidos')
      .send({
        nombre_cliente: 'Ref',
        items: [
          {
            producto_id: producto,
            cantidad: 1,
            base_id: base,
            salsa_ids: [],
            adiciones: [],
          },
        ],
      });
    expect(pedido.status).toBe(201);

    const del = await request(app).delete(`/catalogo/productos/${producto}`);
    expect(del.status).toBe(409);
  });
});
