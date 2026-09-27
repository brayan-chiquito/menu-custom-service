import type { AppDatabase } from './db.js';
import { hashPassword } from './password.js';
import { validarPasswordPolitica } from './passwordPolicy.js';

/** Cambia la clave del usuario `admin` y cierra sus sesiones. */
export function resetAdminPassword(db: AppDatabase, password: string): void {
  const policyError = validarPasswordPolitica(password);
  if (policyError) {
    throw new Error(policyError);
  }

  const row = db.prepare(`SELECT id FROM usuarios WHERE usuario = 'admin'`).get() as
    | { id: number }
    | undefined;
  if (!row) {
    throw new Error('No existe el usuario admin. Arranca el backend una vez para crearlo.');
  }

  db.prepare(`UPDATE usuarios SET password_hash = ? WHERE id = ?`).run(hashPassword(password), row.id);
  db.prepare(`DELETE FROM sesiones WHERE usuario_id = ?`).run(row.id);
}
