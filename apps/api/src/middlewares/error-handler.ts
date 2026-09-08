import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../utils/http-error.js';

/**
 * Debe registrarse el ÚLTIMO (después de rutas y del 404).
 * Los errores no controlados se responden como 500 genérico.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({ message: err.message, code: err.code });
    return;
  }
  // eslint-disable-next-line no-console
  console.error('[gym-api] unexpected error:', err);
  res.status(500).json({ message: 'Error interno del servidor', code: 'INTERNAL_ERROR' });
}
