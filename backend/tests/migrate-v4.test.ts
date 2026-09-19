import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { afterEach, describe, expect, it } from 'vitest';
import { createDatabase } from '../src/shared/db.js';
import { seedMenu } from '../src/seed/seed.js';

describe('migrate v3 → v4 (nullable base_id)', () => {
  const tempFiles: string[] = [];

  afterEach(() => {
    for (const file of tempFiles) {
      try {
        fs.unlinkSync(file);
      } catch {
        // ignore
      }
    }
    tempFiles.length = 0;
  });

  it('should keep pedidos when upgrading from schema v3', () => {
    const dbPath = path.join(os.tmpdir(), `menu-migrate-${Date.now()}.db`);
    tempFiles.push(dbPath);

    const db = new Database(dbPath);
    db.exec(`
      CREATE TABLE schema_migrations (version INTEGER PRIMARY KEY);
      INSERT INTO schema_migrations (version) VALUES (3);

      CREATE TABLE productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE,
        descripcion TEXT NOT NULL DEFAULT '',
        precio REAL NOT NULL,
        categoria TEXT NOT NULL DEFAULT 'platos',
        disponible INTEGER NOT NULL DEFAULT 1,
        requiere_proteina INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE bases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE
      );
      CREATE TABLE salsas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE
      );
      CREATE TABLE proteinas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE
      );
      CREATE TABLE adiciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE,
        precio REAL NOT NULL,
        producto_id INTEGER NULL
      );
      CREATE TABLE pedidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre_cliente TEXT NOT NULL,
        total REAL NOT NULL,
        monto_pagado REAL NULL,
        vuelto REAL NULL,
        estado TEXT NOT NULL DEFAULT 'pendiente',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE pedido_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pedido_id INTEGER NOT NULL,
        producto_id INTEGER NOT NULL,
        cantidad INTEGER NOT NULL,
        precio_unit_momento REAL NOT NULL,
        base_id INTEGER NOT NULL,
        proteina_id INTEGER NULL
      );
      CREATE TABLE pedido_item_salsas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pedido_item_id INTEGER NOT NULL,
        salsa_id INTEGER NOT NULL
      );
      CREATE TABLE pedido_item_adiciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pedido_item_id INTEGER NOT NULL,
        adicion_id INTEGER NOT NULL,
        precio_momento REAL NOT NULL
      );

      INSERT INTO productos (nombre, descripcion, precio, categoria, disponible, requiere_proteina)
      VALUES ('Quesudo', 'test', 10000, 'platos', 1, 0);
      INSERT INTO bases (nombre) VALUES ('Verde');
      INSERT INTO pedidos (nombre_cliente, total, estado) VALUES ('Ana', 10000, 'pendiente');
      INSERT INTO pedido_items (pedido_id, producto_id, cantidad, precio_unit_momento, base_id)
      VALUES (1, 1, 1, 10000, 1);
    `);
    db.close();

    const upgraded = createDatabase(dbPath);
    seedMenu(upgraded);

    const pedidos = (
      upgraded.prepare(`SELECT COUNT(*) AS n FROM pedidos`).get() as { n: number }
    ).n;
    const items = (
      upgraded.prepare(`SELECT COUNT(*) AS n FROM pedido_items`).get() as { n: number }
    ).n;
    const limonada = upgraded
      .prepare(`SELECT precio, categoria FROM productos WHERE nombre = 'Limonada de maracuyá'`)
      .get() as { precio: number; categoria: string };
    const baseCol = (
      upgraded.prepare(`PRAGMA table_info(pedido_items)`).all() as Array<{
        name: string;
        notnull: number;
      }>
    ).find((c) => c.name === 'base_id');
    const version = (
      upgraded.prepare(`SELECT MAX(version) AS v FROM schema_migrations`).get() as { v: number }
    ).v;

    expect(pedidos).toBe(1);
    expect(items).toBe(1);
    expect(limonada.precio).toBe(3000);
    expect(limonada.categoria).toBe('bebidas');
    expect(baseCol?.notnull).toBe(0);
    expect(version).toBe(4);

    upgraded.close();
  });
});
