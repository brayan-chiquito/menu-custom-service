import path from 'node:path';
import fs from 'node:fs';
import Database from 'better-sqlite3';

const DEFAULT_DB_PATH = path.join(process.cwd(), 'data', 'menu.db');
const SCHEMA_VERSION = 4;

export type AppDatabase = Database.Database;

export function createDatabase(dbPath: string = process.env.DATABASE_PATH ?? DEFAULT_DB_PATH): AppDatabase {
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }

  const db = new Database(dbPath);
  // DELETE evita SQLITE_IOERR_SHMOPEN en volúmenes Docker (Windows).
  const journalMode = (process.env.SQLITE_JOURNAL_MODE ?? 'DELETE').toUpperCase();
  db.pragma(`journal_mode = ${journalMode}`);
  db.pragma('foreign_keys = ON');
  migrate(db);
  return db;
}

export function migrate(db: AppDatabase): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY
    );
  `);

  const row = db.prepare(`SELECT MAX(version) AS version FROM schema_migrations`).get() as {
    version: number | null;
  };
  const currentVersion = row.version ?? 0;

  // v1–v3: recrear esquema (entornos viejos / tests). No usar en prod con datos.
  if (currentVersion > 0 && currentVersion < 3) {
    db.exec(`
      DROP TABLE IF EXISTS pedido_item_adiciones;
      DROP TABLE IF EXISTS pedido_item_salsas;
      DROP TABLE IF EXISTS pedido_items;
      DROP TABLE IF EXISTS pedidos;
      DROP TABLE IF EXISTS adiciones;
      DROP TABLE IF EXISTS proteinas;
      DROP TABLE IF EXISTS salsas;
      DROP TABLE IF EXISTS bases;
      DROP TABLE IF EXISTS productos;
    `);
  }

  ensureBaseSchema(db);

  // v3 → v4: base_id nullable (bebidas) sin borrar pedidos.
  if (currentVersion === 3) {
    migrateV3ToV4NullableBase(db);
  }

  if (currentVersion < SCHEMA_VERSION) {
    db.prepare(`INSERT INTO schema_migrations (version) VALUES (?)`).run(SCHEMA_VERSION);
  }
}

function ensureBaseSchema(db: AppDatabase): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE,
      descripcion TEXT NOT NULL DEFAULT '',
      precio REAL NOT NULL,
      categoria TEXT NOT NULL DEFAULT 'platos',
      disponible INTEGER NOT NULL DEFAULT 1 CHECK (disponible IN (0, 1)),
      requiere_proteina INTEGER NOT NULL DEFAULT 0 CHECK (requiere_proteina IN (0, 1))
    );

    CREATE TABLE IF NOT EXISTS bases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS salsas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS proteinas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS adiciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE,
      precio REAL NOT NULL,
      producto_id INTEGER NULL REFERENCES productos(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pedidos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre_cliente TEXT NOT NULL,
      total REAL NOT NULL,
      monto_pagado REAL NULL,
      vuelto REAL NULL,
      estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pedido_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
      producto_id INTEGER NOT NULL REFERENCES productos(id),
      cantidad INTEGER NOT NULL CHECK (cantidad > 0),
      precio_unit_momento REAL NOT NULL,
      base_id INTEGER NULL REFERENCES bases(id),
      proteina_id INTEGER NULL REFERENCES proteinas(id)
    );

    CREATE TABLE IF NOT EXISTS pedido_item_salsas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_item_id INTEGER NOT NULL REFERENCES pedido_items(id) ON DELETE CASCADE,
      salsa_id INTEGER NOT NULL REFERENCES salsas(id)
    );

    CREATE TABLE IF NOT EXISTS pedido_item_adiciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_item_id INTEGER NOT NULL REFERENCES pedido_items(id) ON DELETE CASCADE,
      adicion_id INTEGER NOT NULL REFERENCES adiciones(id),
      precio_momento REAL NOT NULL
    );
  `);
}

/** Copia pedido_items a una tabla con base_id NULL; conserva pedidos e ítems. */
function migrateV3ToV4NullableBase(db: AppDatabase): void {
  const table = db
    .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'pedido_items'`)
    .get() as { name: string } | undefined;

  if (!table) {
    return;
  }

  // Si ya es nullable (DB creada en v4), no tocar.
  const cols = db.prepare(`PRAGMA table_info(pedido_items)`).all() as Array<{
    name: string;
    notnull: number;
  }>;
  const baseCol = cols.find((c) => c.name === 'base_id');
  if (!baseCol || baseCol.notnull === 0) {
    return;
  }

  db.pragma('foreign_keys = OFF');
  const txn = db.transaction(() => {
    db.exec(`
      CREATE TABLE pedido_items_v4 (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
        producto_id INTEGER NOT NULL REFERENCES productos(id),
        cantidad INTEGER NOT NULL CHECK (cantidad > 0),
        precio_unit_momento REAL NOT NULL,
        base_id INTEGER NULL REFERENCES bases(id),
        proteina_id INTEGER NULL REFERENCES proteinas(id)
      );

      INSERT INTO pedido_items_v4 (
        id, pedido_id, producto_id, cantidad, precio_unit_momento, base_id, proteina_id
      )
      SELECT id, pedido_id, producto_id, cantidad, precio_unit_momento, base_id, proteina_id
      FROM pedido_items;

      DROP TABLE pedido_items;
      ALTER TABLE pedido_items_v4 RENAME TO pedido_items;
    `);
  });
  txn();
  db.pragma('foreign_keys = ON');
}
