import type { NextFunction, Request, Response } from 'express';
import { getDashboardHoy, getResumenDashboard } from '../services/dashboard.service.js';

/** GET /api/dashboard/hoy — panel del día en la zona del gimnasio. */
export async function dashboardHoyController(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dashboard = await getDashboardHoy();
    res.status(200).json(dashboard);
  } catch (err) {
    next(err);
  }
}

/** GET /api/dashboard/resumen?mes=YYYY-MM — socios, pagos del mes y cobranza. */
export async function dashboardResumenController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const resumen = await getResumenDashboard(req.query.mes);
    res.status(200).json(resumen);
  } catch (err) {
    next(err);
  }
}
