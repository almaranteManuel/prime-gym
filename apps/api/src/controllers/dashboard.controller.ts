import type { NextFunction, Request, Response } from 'express';
import { getDashboardHoy } from '../services/dashboard.service.js';

/** GET /api/dashboard/hoy — panel del día en la zona del gimnasio. */
export async function dashboardHoyController(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dashboard = await getDashboardHoy();
    res.status(200).json(dashboard);
  } catch (err) {
    next(err);
  }
}
