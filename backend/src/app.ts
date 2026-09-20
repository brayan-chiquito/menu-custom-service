import express from 'express';
import cors from 'cors';
import type { AppDatabase } from './shared/db.js';
import { errorMiddleware } from './shared/middlewares/error.middleware.js';
import { ProductosRepository } from './modules/productos/productos.repository.js';
import { ProductosService } from './modules/productos/productos.service.js';
import { ProductosController } from './modules/productos/productos.controller.js';
import { createProductosRouter } from './modules/productos/productos.routes.js';
import { PedidosRepository } from './modules/pedidos/pedidos.repository.js';
import { PedidosService } from './modules/pedidos/pedidos.service.js';
import { PedidosController } from './modules/pedidos/pedidos.controller.js';
import { createPedidosRouter } from './modules/pedidos/pedidos.routes.js';
import { FakeNotificador } from './modules/notificaciones/fake.notificador.js';
import { WhatsappNotificador } from './modules/notificaciones/whatsapp.notificador.js';
import type { Notificador } from './modules/notificaciones/notificador.interface.js';

export function createNotificador(): Notificador {
  const target = process.env.WHATSAPP_TARGET_NUMBER?.trim();
  if (target) {
    const whatsapp = new WhatsappNotificador(target);
    void whatsapp.iniciar();
    return whatsapp;
  }
  return new FakeNotificador();
}

export function createApp(db: AppDatabase, notificador: Notificador = createNotificador()) {
  const app = express();

  const productosRepository = new ProductosRepository(db);
  const productosService = new ProductosService(productosRepository);
  const productosController = new ProductosController(productosService);

  const pedidosRepository = new PedidosRepository(db);
  const pedidosService = new PedidosService(pedidosRepository, notificador);
  const pedidosController = new PedidosController(pedidosService);

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'menu-custom-backend',
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/menu', createProductosRouter(productosController));
  app.use('/pedidos', createPedidosRouter(pedidosController));

  app.use(errorMiddleware);

  return app;
}
