import { Router } from 'express';
import {
  createSocioController,
  deleteSocioController,
  listSocioMembresiasController,
  listSocioPagosController,
  listSociosController,
  updateSocioController,
} from '../controllers/socios.controller.js';

export const sociosRouter: Router = Router();

sociosRouter.get('/', listSociosController);
sociosRouter.post('/', createSocioController);
sociosRouter.get('/:id/pagos', listSocioPagosController);
sociosRouter.get('/:id/membresias', listSocioMembresiasController);
sociosRouter.put('/:id', updateSocioController);
sociosRouter.delete('/:id', deleteSocioController);
