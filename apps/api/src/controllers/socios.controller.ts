import type { NextFunction, Request, Response } from 'express';
import { createSocio, deactivateSocio, listSocios, updateSocio, type EstadoSocios } from '../services/socios.service.js';
import { listPagosPorSocio } from '../services/pagos.service.js';
import { listMembresiasPorSocio } from '../services/membresias.service.js';
import { HttpError } from '../utils/http-error.js';

/**
 * GET /api/socios?estado=activos|inactivos|todos — lista socios.
 * Por defecto solo activos. El frontend pide `todos` para las tabs.
 */
export async function listSociosController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const raw = req.query.estado;
    const estadoRaw = raw === undefined ? 'activos' : String(raw);
    if (estadoRaw !== 'activos' && estadoRaw !== 'inactivos' && estadoRaw !== 'todos') {
      throw new HttpError(400, 'Parámetro estado inválido. Valores: activos, inactivos, todos', 'VALIDATION_ERROR');
    }
    const estado: EstadoSocios = estadoRaw;
    const socios = await listSocios(estado);
    res.status(200).json(socios);
  } catch (err) {
    next(err);
  }
}

/** POST /api/socios — alta de socio. */
export async function createSocioController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const socio = await createSocio(req.body);
    res.status(201).json(socio);
  } catch (err) {
    next(err);
  }
}

/** PUT /api/socios/:id — actualización de datos. */
export async function updateSocioController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const socio = await updateSocio(req.params.id, req.body);
    res.status(200).json(socio);
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/socios/:id — baja lógica (activo = false). */
export async function deleteSocioController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const socio = await deactivateSocio(req.params.id);
    res.status(200).json(socio);
  } catch (err) {
    next(err);
  }
}

/** GET /api/socios/:id/pagos — historial de pagos del socio (más recientes primero). */
export async function listSocioPagosController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const pagos = await listPagosPorSocio(req.params.id);
    res.status(200).json(pagos);
  } catch (err) {
    next(err);
  }
}

/** GET /api/socios/:id/membresias — historial de membresías del socio (vigencia reciente primero). */
export async function listSocioMembresiasController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const membresias = await listMembresiasPorSocio(req.params.id);
    res.status(200).json(membresias);
  } catch (err) {
    next(err);
  }
}
