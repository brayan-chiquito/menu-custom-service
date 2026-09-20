import Database from 'better-sqlite3';

const dbPath = process.env.DATABASE_PATH ?? '/app/data/menu.db';
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

const before = db.prepare('SELECT COUNT(*) AS n FROM pedidos').get();

db.exec(`
  DELETE FROM pedido_item_adiciones;
  DELETE FROM pedido_item_salsas;
  DELETE FROM pedido_items;
  DELETE FROM pedidos;
`);

try {
  db.exec(`
    DELETE FROM sqlite_sequence
    WHERE name IN ('pedidos', 'pedido_items', 'pedido_item_salsas', 'pedido_item_adiciones');
  `);
} catch {
  // sqlite_sequence may not exist
}

const after = db.prepare('SELECT COUNT(*) AS n FROM pedidos').get();
const productos = db.prepare('SELECT COUNT(*) AS n FROM productos').get();

console.log(
  JSON.stringify({
    pedidos_antes: before.n,
    pedidos_despues: after.n,
    productos_menu: productos.n,
    siguiente_pedido_id: 1,
  }),
);

db.close();
