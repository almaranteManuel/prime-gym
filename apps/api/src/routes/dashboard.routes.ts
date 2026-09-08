import { Router } from 'express';
import { dashboardHoyController } from '../controllers/dashboard.controller.js';

export const dashboardRouter: Router = Router();

dashboardRouter.get('/hoy', dashboardHoyController);
