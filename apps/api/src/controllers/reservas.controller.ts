import type { NextFunction, Request, Response } from 'express';
import { deleteReserva } from '../services/reservas.service.js';

/** DELETE /api/reservas/:id — desasigna un alumno (elimina la reserva). */
export async function deleteReservaController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await deleteReserva(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
