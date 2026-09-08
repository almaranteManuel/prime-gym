import { Router } from 'express';
import {
  createRutinaController,
  listRutinasPorSocioController,
} from '../controllers/rutinas.controller.js';

export const rutinasRouter: Router = Router();

rutinasRouter.post('/', createRutinaController);
rutinasRouter.get('/socio/:socioId', listRutinasPorSocioController);
