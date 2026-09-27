import { afterEach, describe, expect, it } from 'vitest';
import { createDatabase, type AppDatabase } from '../src/shared/db.js';
import { assertProdConfig } from '../src/shared/prodConfig.js';
import { resetAdminPassword } from '../src/shared/resetAdminPassword.js';
import { verifyPassword } from '../src/shared/password.js';

describe('prod config + reset admin', () => {
  const previous = {
    ENFORCE_PROD_CONFIG: process.env.ENFORCE_PROD_CONFIG,
    REQUIRE_AUTH: process.env.REQUIRE_AUTH,
    COOKIE_SECURE: process.env.COOKIE_SECURE,
    CORS_ORIGINS: process.env.CORS_ORIGINS,
  };

  afterEach(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  it('should skip checks when ENFORCE_PROD_CONFIG is off', () => {
    delete process.env.ENFORCE_PROD_CONFIG;
    delete process.env.CORS_ORIGINS;
    expect(() => assertProdConfig()).not.toThrow();
  });

  it('should reject incomplete prod config', () => {
    process.env.ENFORCE_PROD_CONFIG = '1';
    process.env.REQUIRE_AUTH = '0';
    delete process.env.COOKIE_SECURE;
    delete process.env.CORS_ORIGINS;
    expect(() => assertProdConfig()).toThrow(/REQUIRE_AUTH|COOKIE_SECURE|CORS_ORIGINS/);
  });

  it('should reset admin password and drop sessions', () => {
    const db: AppDatabase = createDatabase(':memory:');
    const admin = db.prepare(`SELECT id FROM usuarios WHERE usuario = 'admin'`).get() as {
      id: number;
    };
    db.prepare(`INSERT INTO sesiones (token, usuario_id) VALUES ('abc', ?)`).run(admin.id);

    resetAdminPassword(db, 'NuevaClave1!');

    const row = db.prepare(`SELECT password_hash FROM usuarios WHERE id = ?`).get(admin.id) as {
      password_hash: string;
    };
    expect(verifyPassword('NuevaClave1!', row.password_hash)).toBe(true);
    const sesiones = db.prepare(`SELECT COUNT(*) AS n FROM sesiones`).get() as { n: number };
    expect(sesiones.n).toBe(0);
    db.close();
  });
});
