import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import request from 'supertest';
import { createApp } from '../src/app.js';
import {
  etiquetaPeriodoBalance,
  nombreArchivoBalance,
} from '../src/modules/pedidos/balance.export.js';
import { FakeNotificador } from '../src/modules/notificaciones/fake.notificador.js';
import { createDatabase, type AppDatabase } from '../src/shared/db.js';
import { seedMenu } from '../src/seed/seed.js';

describe('nombreArchivoBalance / etiquetaPeriodo', () => {
  it('should embed dates for hoy, semana and mes', () => {
    expect(
      nombreArchivoBalance({ periodo: 'hoy', desde: '2026-09-20', hasta: '2026-09-20' }),
    ).toBe('balance-platanopolis-hoy-2026-09-20.xlsx');
    expect(
      nombreArchivoBalance({ periodo: 'semana', desde: '2026-09-14', hasta: '2026-09-20' }),
    ).toBe('balance-platanopolis-semana-2026-09-14_al_2026-09-20.xlsx');
    expect(
      nombreArchivoBalance({ periodo: 'mes', desde: '2026-09-01', hasta: '2026-09-20' }),
    ).toBe('balance-platanopolis-mes-2026-09.xlsx');
  });

  it('should label periodo in Spanish with dates', () => {
    expect(etiquetaPeriodoBalance('hoy', '2026-09-20', '2026-09-20')).toContain('Hoy');
    expect(etiquetaPeriodoBalance('hoy', '2026-09-20', '2026-09-20')).toContain('2026');
    expect(etiquetaPeriodoBalance('semana', '2026-09-14', '2026-09-20')).toMatch(/Semana/);
    expect(etiquetaPeriodoBalance('mes', '2026-09-01', '2026-09-20')).toMatch(/septiembre/i);
  });
});

describe('GET /pedidos/balance/export', () => {
  let db: AppDatabase;

  beforeEach(() => {
    db = createDatabase(':memory:');
    seedMenu(db);
  });

  afterEach(() => {
    db.close();
  });

  it('should return xlsx with Resumen Pedidos Egresos and AutoFilter', async () => {
    const app = createApp(db, new FakeNotificador());
    const menu = await request(app).get('/menu');
    const quesudo = menu.body.productos.find((p: { nombre: string }) => p.nombre === 'Quesudo');
    const base = menu.body.bases[0];
    const salsa = menu.body.salsas[0];

    const creado = await request(app)
      .post('/pedidos')
      .send({
        nombre_cliente: 'Ana',
        indicaciones: 'Sin cebolla',
        items: [
          {
            producto_id: quesudo.id,
            cantidad: 1,
            base_id: base.id,
            salsa_ids: [salsa.id],
            adiciones: [],
          },
        ],
      });
    expect(creado.status).toBe(201);
    await request(app)
      .patch(`/pedidos/${creado.body.id}/pago`)
      .send({ monto_pagado: creado.body.total });
    await request(app).patch(`/pedidos/${creado.body.id}/confirmar`);

    await request(app).post('/egresos').send({
      nombre: 'Plátano',
      precio: 2000,
      cantidad: 3,
    });

    const res = await request(app)
      .get('/pedidos/balance/export?periodo=hoy')
      .buffer()
      .parse((incoming, cb) => {
        const chunks: Buffer[] = [];
        incoming.on('data', (c: Buffer) => chunks.push(c));
        incoming.on('end', () => cb(null, Buffer.concat(chunks)));
      });
    expect(res.status).toBe(200);
    expect(String(res.headers['content-type'])).toMatch(/spreadsheetml/);
    expect(String(res.headers['content-disposition'])).toMatch(/balance-platanopolis-.*\.xlsx/);

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(res.body as Buffer);
    expect(wb.worksheets.map((s) => s.name)).toEqual(['Resumen', 'Historial', 'Egresos']);

    const historial = wb.getWorksheet('Historial');
    expect(historial).toBeTruthy();
    expect(historial!.autoFilter).toBeTruthy();
    expect(String(historial!.getCell(1, 1).value)).toMatch(/Historial de pedidos/);
    expect(historial!.getRow(2).getCell(1).value).toBe('Fecha');
    expect(historial!.rowCount).toBeGreaterThanOrEqual(3);

    const egresos = wb.getWorksheet('Egresos');
    expect(egresos!.autoFilter).toBeTruthy();
    expect(egresos!.rowCount).toBeGreaterThanOrEqual(3);

    const resumen = wb.getWorksheet('Resumen');
    const conceptos: string[] = [];
    resumen!.eachRow((row) => {
      const v = row.getCell(1).value;
      if (typeof v === 'string') conceptos.push(v);
    });
    expect(conceptos).toContain('Ganancia');
    expect(conceptos).toContain('Cobrado');

    expect(String(res.headers['content-disposition'])).toMatch(
      /balance-platanopolis-hoy-\d{4}-\d{2}-\d{2}\.xlsx/,
    );
  });

  it('should name files by semana and mes ranges', async () => {
    const app = createApp(db, new FakeNotificador());
    const semana = await request(app)
      .get('/pedidos/balance/export?periodo=semana')
      .buffer()
      .parse((incoming, cb) => {
        const chunks: Buffer[] = [];
        incoming.on('data', (c: Buffer) => chunks.push(c));
        incoming.on('end', () => cb(null, Buffer.concat(chunks)));
      });
    expect(semana.status).toBe(200);
    expect(String(semana.headers['content-disposition'])).toMatch(
      /balance-platanopolis-semana-\d{4}-\d{2}-\d{2}_al_\d{4}-\d{2}-\d{2}\.xlsx/,
    );

    const mes = await request(app)
      .get('/pedidos/balance/export?periodo=mes')
      .buffer()
      .parse((incoming, cb) => {
        const chunks: Buffer[] = [];
        incoming.on('data', (c: Buffer) => chunks.push(c));
        incoming.on('end', () => cb(null, Buffer.concat(chunks)));
      });
    expect(mes.status).toBe(200);
    expect(String(mes.headers['content-disposition'])).toMatch(
      /balance-platanopolis-mes-\d{4}-\d{2}\.xlsx/,
    );
  });

  it('should export empty sheets with headers when no movements', async () => {
    const app = createApp(db, new FakeNotificador());
    const res = await request(app)
      .get('/pedidos/balance/export?periodo=hoy')
      .buffer()
      .parse((incoming, cb) => {
        const chunks: Buffer[] = [];
        incoming.on('data', (c: Buffer) => chunks.push(c));
        incoming.on('end', () => cb(null, Buffer.concat(chunks)));
      });
    expect(res.status).toBe(200);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(res.body as Buffer);
    expect(wb.getWorksheet('Historial')!.getRow(2).getCell(4).value).toBe('Cliente');
    expect(wb.getWorksheet('Egresos')!.getRow(2).getCell(3).value).toBe('Nombre');
  });

  it('should reject invalid periodo', async () => {
    const app = createApp(db, new FakeNotificador());
    const res = await request(app).get('/pedidos/balance/export?periodo=año');
    expect(res.status).toBe(400);
  });
});
