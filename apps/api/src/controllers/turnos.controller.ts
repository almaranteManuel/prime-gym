import type { NextFunction, Request, Response } from 'express';
import {
  asignarSocioATurno,
  createTurno,
  deleteTurno,
  listTurnos,
  updateTurno,
} from '../services/turnos.service.js';

/** GET /api/turnos — turnos con ocupación (grupo semanal, sin fecha). */
export async function listTurnosController(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const turnos = await listTurnos();
    res.status(200).json(turnos);
  } catch (err) {
    next(err);
  }
}

/** POST /api/turnos — alta de turno. */
export async function createTurnoController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const turno = await createTurno(req.body);
    res.status(201).json(turno);
  } catch (err) {
    next(err);
  }
}

/** PUT /api/turnos/:id — actualización de turno. */
export async function updateTurnoController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const turno = await updateTurno(req.params.id, req.body);
    res.status(200).json(turno);
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/turnos/:id — elimina un turno sin reservas. */
export async function deleteTurnoController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await deleteTurno(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

/** POST /api/turnos/:id/asignar — asigna un socio activo al turno (control de cupo). */
export async function asignarTurnoController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await asignarSocioATurno(req.params.id, req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}
