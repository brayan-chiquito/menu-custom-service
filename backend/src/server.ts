import path from 'node:path';
import dotenv from 'dotenv';
import { createApp } from './app.js';
import { createDatabase } from './shared/db.js';

// Raíz del monorepo (.env) y opcional backend/.env (sobrescribe).
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// QA: no usar WhatsApp real ni la sesión de producción.
if (process.env.QA === '1') {
  delete process.env.WHATSAPP_TARGET_NUMBER;
  process.env.WWEBJS_AUTH_PATH =
    process.env.WWEBJS_AUTH_PATH ?? path.resolve(process.cwd(), '.wwebjs_auth_qa');
}

const port = Number(process.env.PORT) || 3000;
const db = createDatabase();
const app = createApp(db);

app.listen(port, '0.0.0.0', () => {
  const target = process.env.WHATSAPP_TARGET_NUMBER?.trim();
  console.log(`Backend escuchando en http://0.0.0.0:${port}`);
  if (target) {
    console.log(
      `[WhatsApp] Destino: ${target}. Escanea el QR con el teléfono que ENVÍA (sesión en .wwebjs_auth).`,
    );
  } else {
    console.log('[WhatsApp] Sin WHATSAPP_TARGET_NUMBER → FakeNotificador (simulado).');
  }
});
