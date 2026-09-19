import type { ErrorRequestHandler } from 'express';
import { AppError } from '../errors.js';

export const errorMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      ...err.details,
    });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
};
