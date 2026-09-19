import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { createDatabase, type AppDatabase } from '../src/shared/db.js';
import { seedMenu } from '../src/seed/seed.js';
import { FakeNotificador } from '../src/modules/notificaciones/fake.notificador.js';

describe('GET /menu', () => {
  let db: AppDatabase;

  beforeEach(() => {
    db = createDatabase(':memory:');
    seedMenu(db);
  });

  afterEach(() => {
    db.close();
  });

  it('should return productos, bases, salsas and proteinas', async () => {
    const app = createApp(db, new FakeNotificador());
    const response = await request(app).get('/menu');

    expect(response.status).toBe(200);
    expect(response.body.bases.map((b: { nombre: string }) => b.nombre)).toEqual([
      'Maduro',
      'Verde',
    ]);
    expect(response.body.salsas.map((s: { nombre: string }) => s.nombre)).toEqual([
      'Ajo',
      'Agridulce',
      'Ranchera',
      'BBQ',
    ]);
    expect(response.body.proteinas.map((p: { nombre: string }) => p.nombre)).toEqual([
      'Carne',
      'Pollo',
    ]);

    const candente = response.body.productos.find(
      (p: { nombre: string }) => p.nombre === 'Candente',
    );
    const apoteosico = response.body.productos.find(
      (p: { nombre: string }) => p.nombre === 'Apoteósico',
    );

    expect(candente.requiere_proteina).toBe(true);
    expect(apoteosico.requiere_proteina).toBe(false);
    expect(candente.descripcion).toContain('Carne o Pollo');
    expect(apoteosico.descripcion).toContain('Carne y Pollo');
    const limonada = response.body.productos.find(
      (p: { nombre: string }) => p.nombre === 'Limonada de maracuyá',
    );
    expect(limonada).toMatchObject({
      precio: 3000,
      categoria: 'bebidas',
      requiere_proteina: false,
    });
  });

  it('should enforce unique names via schema', () => {
    expect(() => {
      db.prepare(`INSERT INTO bases (nombre) VALUES ('Maduro')`).run();
    }).toThrow();
  });
});
