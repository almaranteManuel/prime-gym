import { Router } from 'express';
import { checkRole, verificarToken } from '../middlewares/auth.js';
import { authRouter } from './auth.routes.js';
import { dashboardRouter } from './dashboard.routes.js';
import { healthRouter } from './health.routes.js';
import { pagosRouter } from './pagos.routes.js';
import { reservasRouter } from './reservas.routes.js';
import { rutinasRouter } from './rutinas.routes.js';
import { sociosRouter } from './socios.routes.js';
import { turnosRouter } from './turnos.routes.js';

export const apiRouter: Router = Router();

// GET /api/health
apiRouter.use('/health', healthRouter);

// POST /api/auth/login · POST /api/auth/register
apiRouter.use('/auth', authRouter);

// El resto de la API es administrativa y requiere autenticación.
apiRouter.use(verificarToken, checkRole(['admin']));

// GET /api/dashboard/hoy
apiRouter.use('/dashboard', dashboardRouter);

// GET/POST /api/socios · PUT/DELETE /api/socios/:id
apiRouter.use('/socios', sociosRouter);

// POST /api/pagos
apiRouter.use('/pagos', pagosRouter);

// GET/POST /api/turnos · PUT/DELETE /api/turnos/:id · POST /api/turnos/:id/asignar
apiRouter.use('/turnos', turnosRouter);

// DELETE /api/reservas/:id
apiRouter.use('/reservas', reservasRouter);

// POST /api/rutinas · GET /api/rutinas/socio/:socioId · DELETE /api/rutinas/:id
apiRouter.use('/rutinas', rutinasRouter);

// GET /api (info base)
apiRouter.get('/', (_req, res) => {
  res.json({ name: 'gym-api', version: '0.1.0' });
});
