import type { NextFunction, Request, Response } from 'express';
import { createRutina, deleteRutina, listRutinasPorSocio } from '../services/rutinas.service.js';

/** POST /api/rutinas — crea y asigna una rutina a un socio. */
export async function createRutinaController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rutina = await createRutina(req.body);
    res.status(201).json(rutina);
  } catch (err) {
    next(err);
  }
}

/** GET /api/rutinas/socio/:socioId — rutinas de un alumno. */
export async function listRutinasPorSocioController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rutinas = await listRutinasPorSocio(req.params.socioId);
    res.status(200).json(rutinas);
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/rutinas/:id — elimina una rutina de un alumno. */
export async function deleteRutinaController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await deleteRutina(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
