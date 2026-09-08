import { Router } from 'express';
import {
  createSocioController,
  deleteSocioController,
  listSociosController,
  updateSocioController,
} from '../controllers/socios.controller.js';

export const sociosRouter: Router = Router();

sociosRouter.get('/', listSociosController);
sociosRouter.post('/', createSocioController);
sociosRouter.put('/:id', updateSocioController);
sociosRouter.delete('/:id', deleteSocioController);
