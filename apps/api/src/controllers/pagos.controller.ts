import type { NextFunction, Request, Response } from 'express';
import { registrarPago } from '../services/pagos.service.js';

/** POST /api/pagos — registra el pago y crea/extiende la membresía +1 mes (reactiva al socio). */
export async function registrarPagoController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await registrarPago(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}
