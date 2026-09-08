import { Router } from 'express';
import {
  asignarTurnoController,
  createTurnoController,
  deleteTurnoController,
  listTurnosController,
  updateTurnoController,
} from '../controllers/turnos.controller.js';

export const turnosRouter: Router = Router();

turnosRouter.get('/', listTurnosController);
turnosRouter.post('/', createTurnoController);
turnosRouter.put('/:id', updateTurnoController);
turnosRouter.delete('/:id', deleteTurnoController);
turnosRouter.post('/:id/asignar', asignarTurnoController);
