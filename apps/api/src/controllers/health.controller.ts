import type { Request, Response } from 'express';
import { getHealth } from '../services/health.service.js';

/**
 * Capa de controlador: traduce HTTP <-> servicio.
 * Demuestra el uso del tipo compartido @gym/shared.
 */
export function healthController(_req: Request, res: Response): void {
  res.json(getHealth());
}
