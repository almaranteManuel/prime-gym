import type { NextFunction, Request, Response } from 'express';
import { createRutina, listRutinasPorSocio } from '../services/rutinas.service.js';

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
