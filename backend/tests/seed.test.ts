import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createDatabase, type AppDatabase } from '../src/shared/db.js';
import { seedMenu } from '../src/seed/seed.js';

describe('seed upsert', () => {
  let db: AppDatabase;

  beforeEach(() => {
    db = createDatabase(':memory:');
  });

  afterEach(() => {
    db.close();
  });

  it('should upsert without duplicating rows when run twice', () => {
    seedMenu(db);
    seedMenu(db);

    const productos = (
      db.prepare(`SELECT COUNT(*) AS total FROM productos`).get() as { total: number }
    ).total;
    const bases = (db.prepare(`SELECT COUNT(*) AS total FROM bases`).get() as { total: number })
      .total;
    const proteinas = (
      db.prepare(`SELECT COUNT(*) AS total FROM proteinas`).get() as { total: number }
    ).total;
    const adiciones = (
      db.prepare(`SELECT COUNT(*) AS total FROM adiciones`).get() as { total: number }
    ).total;

    expect(productos).toBe(8);
    expect(bases).toBe(2);
    expect(proteinas).toBe(2);
    expect(adiciones).toBe(5);

    db.prepare(`UPDATE productos SET precio = 1 WHERE nombre = 'Candente'`).run();
    seedMenu(db);

    const candente = db
      .prepare(`SELECT precio, requiere_proteina FROM productos WHERE nombre = 'Candente'`)
      .get() as { precio: number; requiere_proteina: number };

    expect(candente.precio).toBe(22000);
    expect(candente.requiere_proteina).toBe(1);
  });
});
