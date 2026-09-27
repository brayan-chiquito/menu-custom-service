import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import type { AppDatabase } from './shared/db.js';
import { errorMiddleware } from './shared/middlewares/error.middleware.js';
import { createAuthMiddleware } from './shared/middlewares/auth.middleware.js';
import { ProductosRepository } from './modules/productos/productos.repository.js';
import { ProductosService } from './modules/productos/productos.service.js';
import { ProductosController } from './modules/productos/productos.controller.js';
import { createCatalogoRouter, createProductosRouter } from './modules/productos/productos.routes.js';
import { PedidosRepository } from './modules/pedidos/pedidos.repository.js';
import { PedidosService } from './modules/pedidos/pedidos.service.js';
import { PedidosController } from './modules/pedidos/pedidos.controller.js';
import { createPedidosRouter } from './modules/pedidos/pedidos.routes.js';
import { EgresosRepository } from './modules/egresos/egresos.repository.js';
import { EgresosService } from './modules/egresos/egresos.service.js';
import { EgresosController } from './modules/egresos/egresos.controller.js';
import { createEgresosRouter } from './modules/egresos/egresos.routes.js';
import { FakeNotificador } from './modules/notificaciones/fake.notificador.js';
import type { Notificador } from './modules/notificaciones/notificador.interface.js';
import { resolverRangoPeriodo } from './modules/pedidos/pedidos.balance.js';
import type { PeriodoBalance } from './modules/pedidos/pedidos.types.js';
import { AuthRepository } from './modules/auth/auth.repository.js';
import { AuthService } from './modules/auth/auth.service.js';
import { AuthController } from './modules/auth/auth.controller.js';
import { createAuthRouter } from './modules/auth/auth.routes.js';
import { UsuariosRepository } from './modules/usuarios/usuarios.repository.js';
import { UsuariosService } from './modules/usuarios/usuarios.service.js';
import { UsuariosController } from './modules/usuarios/usuarios.controller.js';
import { createUsuariosRouter } from './modules/usuarios/usuarios.routes.js';
import { AuditoriaRepository } from './modules/auditoria/auditoria.repository.js';
import { AuditoriaService } from './modules/auditoria/auditoria.service.js';
import { AuditoriaController } from './modules/auditoria/auditoria.controller.js';
import { createAuditoriaRouter } from './modules/auditoria/auditoria.routes.js';
import { CocinaRepository } from './modules/cocina/cocina.repository.js';
import { CocinaService } from './modules/cocina/cocina.service.js';
import { CocinaController } from './modules/cocina/cocina.controller.js';
import { createCocinaRouter, createCocinaStreamRouter } from './modules/cocina/cocina.routes.js';

export type CreateAppOptions = {
  requireAuth?: boolean;
};

function buildCorsOptions() {
  const raw = process.env.CORS_ORIGINS?.trim();
  if (!raw) {
    // Dev/QA: abierto. Prod debe definir CORS_ORIGINS.
    return {
      exposedHeaders: ['Content-Disposition'],
    };
  }
  const origins = raw.split(',').map((s) => s.trim()).filter(Boolean);
  return {
    origin: origins,
    credentials: true,
    exposedHeaders: ['Content-Disposition'],
  };
}

export function createNotificador(_db: AppDatabase): Notificador {
  return new FakeNotificador();
}

export function createApp(
  db: AppDatabase,
  notificador: Notificador = createNotificador(db),
  options: CreateAppOptions = {},
) {
  const requireAuth =
    options.requireAuth !== undefined
      ? options.requireAuth
      : process.env.REQUIRE_AUTH !== '0';

  const app = express();

  const authRepository = new AuthRepository(db);
  const authService = new AuthService(authRepository, db);
  const authController = new AuthController(authService);
  const auth = createAuthMiddleware(authService, { requireAuth });

  const usuariosRepository = new UsuariosRepository(db);
  const usuariosService = new UsuariosService(usuariosRepository, db);
  const usuariosController = new UsuariosController(usuariosService);

  const auditoriaRepository = new AuditoriaRepository(db);
  const auditoriaService = new AuditoriaService(auditoriaRepository);
  const auditoriaController = new AuditoriaController(auditoriaService);

  const productosRepository = new ProductosRepository(db);
  const productosService = new ProductosService(productosRepository, db);
  const productosController = new ProductosController(productosService);

  const egresosRepository = new EgresosRepository(db);
  const egresosService = new EgresosService(egresosRepository, db);
  const egresosController = new EgresosController(egresosService);

  const pedidosRepository = new PedidosRepository(db);
  const pedidosService = new PedidosService(pedidosRepository, notificador, db);
  const pedidosController = new PedidosController(
    pedidosService,
    (periodo) => {
      const { desde, hasta } = resolverRangoPeriodo(periodo);
      return egresosRepository.sumTotalEntreFechas(desde, hasta);
    },
    (periodo) => {
      const { desde, hasta } = resolverRangoPeriodo(periodo);
      return egresosRepository.findEntreFechas(desde, hasta);
    },
  );

  const cocinaRepository = new CocinaRepository(db);
  const cocinaService = new CocinaService(cocinaRepository);
  const cocinaController = new CocinaController(cocinaService);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      hsts: process.env.COOKIE_SECURE === '1' ? { maxAge: 15_552_000, includeSubDomains: true } : false,
    }),
  );
  app.use(cors(buildCorsOptions()));
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'menu-custom-backend',
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/auth', createAuthRouter(authController, auth));

  // SSE con ticket corto (no Bearer / no token de sesión en query)
  app.use('/cocina', createCocinaStreamRouter(cocinaController, auth));

  app.use(auth.requireAuth);

  app.use('/usuarios', createUsuariosRouter(usuariosController, auth));
  app.use('/auditoria', auth.requireAdmin, createAuditoriaRouter(auditoriaController));
  app.use('/menu', createProductosRouter(productosController));
  app.use('/catalogo', createCatalogoRouter(productosController));
  app.use('/pedidos', createPedidosRouter(pedidosController));
  app.use('/egresos', createEgresosRouter(egresosController));
  app.use('/cocina', createCocinaRouter(cocinaController, auth));

  app.use(errorMiddleware);

  return app;
}

export type { PeriodoBalance };
