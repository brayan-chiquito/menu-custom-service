import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { createDatabase, type AppDatabase } from '../src/shared/db.js';
import { FakeNotificador } from '../src/modules/notificaciones/fake.notificador.js';
import { _resetLoginRateLimitForTests } from '../src/shared/loginRateLimit.js';
import { _resetStreamTicketsForTests } from '../src/shared/streamTicket.js';

describe('hardening auth (rate-limit, TTL, stream ticket)', () => {
  let db: AppDatabase;

  beforeEach(() => {
    db = createDatabase(':memory:');
    _resetLoginRateLimitForTests();
    _resetStreamTicketsForTests();
    process.env.LOGIN_RATE_MAX = '5';
    process.env.LOGIN_RATE_WINDOW_MS = '60000';
    process.env.SESSION_TTL_HOURS = '24';
  });

  afterEach(() => {
    db.close();
    _resetLoginRateLimitForTests();
    _resetStreamTicketsForTests();
  });

  function app() {
    return createApp(db, new FakeNotificador(), { requireAuth: true });
  }

  async function loginAdmin() {
    const res = await request(app()).post('/auth/login').send({
      usuario: 'admin',
      password: 'Admin123!',
    });
    expect(res.status).toBe(200);
    return res.body as { token: string };
  }

  it('should rate-limit login after too many failed attempts', async () => {
    for (let i = 0; i < 5; i++) {
      const fail = await request(app()).post('/auth/login').send({
        usuario: 'admin',
        password: 'wrong',
      });
      expect(fail.status).toBe(401);
    }
    const blocked = await request(app()).post('/auth/login').send({
      usuario: 'admin',
      password: 'Admin123!',
    });
    expect(blocked.status).toBe(429);
    expect(String(blocked.body.error)).toMatch(/intentos/i);
  });

  it('should expire sessions older than TTL', async () => {
    const { token } = await loginAdmin();
    db.prepare(
      `UPDATE sesiones SET last_seen_at = datetime('now', '-25 hours') WHERE token = ?`,
    ).run(token);

    const me = await request(app())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(me.status).toBe(401);
  });

  it('should issue stream ticket; session token in query no longer works for SSE', async () => {
    const { token } = await loginAdmin();
    const ticketRes = await request(app())
      .post('/cocina/stream-ticket')
      .set('Authorization', `Bearer ${token}`);
    expect(ticketRes.status).toBe(200);
    expect(ticketRes.body.ticket).toMatch(/^[a-f0-9]{32}$/);
    expect(ticketRes.body.expiresIn).toBeGreaterThan(0);

    const withToken = await request(app()).get(
      `/cocina/stream?token=${encodeURIComponent(token)}`,
    );
    expect(withToken.status).toBe(401);

    const { resolveStreamTicket } = await import('../src/shared/streamTicket.js');
    const usuario = resolveStreamTicket(ticketRes.body.ticket);
    expect(usuario.usuario).toBe('admin');
  });

  it('should send nosniff from helmet', async () => {
    const res = await request(app()).get('/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });
});
