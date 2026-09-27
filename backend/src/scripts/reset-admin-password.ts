import path from 'node:path';
import dotenv from 'dotenv';
import { createDatabase } from '../shared/db.js';
import { resetAdminPassword } from '../shared/resetAdminPassword.js';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const password = process.argv[2];
if (!password) {
  console.error('Uso: npm run reset-admin -- <nueva-contraseña>');
  console.error('Ejemplo: npm run reset-admin -- NuevaClave1!');
  process.exit(1);
}

const db = createDatabase();
try {
  resetAdminPassword(db, password);
  console.log('Contraseña de admin actualizada. Sus sesiones quedaron cerradas.');
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'No se pudo resetear';
  console.error(message);
  process.exitCode = 1;
} finally {
  db.close();
}
