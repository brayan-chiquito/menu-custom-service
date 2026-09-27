import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { createDatabase, type AppDatabase } from '../src/shared/db.js';
import { FakeNotificador } from '../src/modules/notificaciones/fake.notificador.js';

describe('auth + usuarios (requireAuth)', () => {
  let db: AppDatabase;

  beforeEach(() => {
    db = createDatabase(':memory:');
  });

  afterEach(() => {
    db.close();
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
    return res.body as { token: string; usuario: { id: number; rol: string } };
  }

  it('should login and return token + usuario', async () => {
    const body = await loginAdmin();
    expect(body.token).toMatch(/^[a-f0-9]{64}$/);
    expect(body.usuario).toMatchObject({
      usuario: 'admin',
      rol: 'admin',
    });
  });

  it('should reject 11th concurrent session', async () => {
    for (let i = 0; i < 10; i++) {
      const res = await request(app()).post('/auth/login').send({
        usuario: 'admin',
        password: 'Admin123!',
      });
      expect(res.status).toBe(200);
    }
    const fail = await request(app()).post('/auth/login').send({
      usuario: 'admin',
      password: 'Admin123!',
    });
    expect(fail.status).toBe(403);
    expect(fail.body.error).toBe('Ya hay 10 sesiones activas. Cierra una para entrar.');
  });

  it('should expose me and logout', async () => {
    const { token } = await loginAdmin();
    const me = await request(app())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body.usuario).toBe('admin');

    const logout = await request(app())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${token}`);
    expect(logout.status).toBe(204);

    const meAfter = await request(app())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(meAfter.status).toBe(401);
  });

  it('should allow admin CRUD usuarios', async () => {
    const { token } = await loginAdmin();

    const creado = await request(app())
      .post('/usuarios')
      .set('Authorization', `Bearer ${token}`)
      .send({
        usuario: 'cocina1',
        nombre: 'Cocinero Uno',
        rol: 'operador',
        password: 'Clave123!',
      });
    expect(creado.status).toBe(201);
    expect(creado.body).toMatchObject({
      usuario: 'cocina1',
      rol: 'operador',
      activo: true,
    });

    const patched = await request(app())
      .patch(`/usuarios/${creado.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ activo: false, nombre: 'Cocinero Off' });
    expect(patched.status).toBe(200);
    expect(patched.body.activo).toBe(false);
    expect(patched.body.nombre).toBe('Cocinero Off');

    const lista = await request(app())
      .get('/usuarios')
      .set('Authorization', `Bearer ${token}`);
    expect(lista.status).toBe(200);
    expect(lista.body.some((u: { usuario: string }) => u.usuario === 'cocina1')).toBe(true);
  });

  it('should reject weak password on create usuario', async () => {
    const { token } = await loginAdmin();
    const res = await request(app())
      .post('/usuarios')
      .set('Authorization', `Bearer ${token}`)
      .send({
        usuario: 'debil',
        nombre: 'Debil',
        rol: 'operador',
        password: 'admin123',
      });
    expect(res.status).toBe(400);
    expect(String(res.body.error)).toMatch(/especial|número|letra|corta/i);
  });

  it('should reject protected routes without token', async () => {
    const res = await request(app()).get('/pedidos?fecha=hoy');
    expect(res.status).toBe(401);
  });

  it('should accept session cookie and revoke sessions', async () => {
    const login = await request(app()).post('/auth/login').send({
      usuario: 'admin',
      password: 'Admin123!',
    });
    const setCookie = login.headers['set-cookie'];
    expect(setCookie?.[0]).toMatch(/platanopolis_session=/);
    expect(setCookie?.[0]).toMatch(/HttpOnly/i);
    const cookie = String(setCookie?.[0]).split(';')[0];

    const me = await request(app()).get('/auth/me').set('Cookie', cookie);
    expect(me.status).toBe(200);

    const op = await request(app())
      .post('/usuarios')
      .set('Cookie', cookie)
      .send({
        usuario: 'opcookie',
        nombre: 'Op Cookie',
        rol: 'operador',
        password: 'Clave123!',
      });
    expect(op.status).toBe(201);

    const opLogin = await request(app()).post('/auth/login').send({
      usuario: 'opcookie',
      password: 'Clave123!',
    });
    const opToken = opLogin.body.token as string;

    const revoked = await request(app())
      .delete(`/usuarios/${op.body.id}/sesiones`)
      .set('Cookie', cookie);
    expect(revoked.status).toBe(200);
    expect(revoked.body.revocadas).toBe(1);

    const after = await request(app())
      .get('/auth/me')
      .set('Authorization', `Bearer ${opToken}`);
    expect(after.status).toBe(401);
  });

  it('should revoke sessions when password changes', async () => {
    const { token } = await loginAdmin();
    const creado = await request(app())
      .post('/usuarios')
      .set('Authorization', `Bearer ${token}`)
      .send({
        usuario: 'oppwd',
        nombre: 'Op Pwd',
        rol: 'operador',
        password: 'Clave123!',
      });
    const opLogin = await request(app()).post('/auth/login').send({
      usuario: 'oppwd',
      password: 'Clave123!',
    });
    const opToken = opLogin.body.token as string;

    const patch = await request(app())
      .patch(`/usuarios/${creado.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ password: 'OtraClave1!' });
    expect(patch.status).toBe(200);

    const after = await request(app())
      .get('/auth/me')
      .set('Authorization', `Bearer ${opToken}`);
    expect(after.status).toBe(401);
  });
});
