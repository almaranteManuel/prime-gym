import { Router } from 'express';
import { dashboardHoyController, dashboardResumenController } from '../controllers/dashboard.controller.js';

export const dashboardRouter: Router = Router();

dashboardRouter.get('/hoy', dashboardHoyController);
dashboardRouter.get('/resumen', dashboardResumenController);
