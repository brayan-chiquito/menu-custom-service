import path from 'node:path';
import dotenv from 'dotenv';
import { createApp, createNotificador } from './app.js';
import { createDatabase } from './shared/db.js';
import { assertProdConfig } from './shared/prodConfig.js';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

if (process.env.QA === '1') {
  process.env.WWEBJS_AUTH_PATH =
    process.env.WWEBJS_AUTH_PATH ?? path.resolve(process.cwd(), '.wwebjs_auth_qa');
}

assertProdConfig();

const port = Number(process.env.PORT) || 3000;
const db = createDatabase();
const app = createApp(db, createNotificador(db));

app.listen(port, '0.0.0.0', () => {
  console.log(`Backend escuchando en http://0.0.0.0:${port}`);
  console.log('[Avisos] WhatsApp operativo desactivado; usar Cocina para preparar pedidos.');
});
