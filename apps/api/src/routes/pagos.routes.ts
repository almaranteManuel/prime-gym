import { Router } from 'express';
import { registrarPagoController } from '../controllers/pagos.controller.js';

export const pagosRouter: Router = Router();

pagosRouter.post('/', registrarPagoController);
