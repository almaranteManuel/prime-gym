import { Router } from 'express';
import { deleteReservaController } from '../controllers/reservas.controller.js';

export const reservasRouter: Router = Router();

reservasRouter.delete('/:id', deleteReservaController);
