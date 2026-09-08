import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { errorHandler } from './middlewares/error-handler.js';
import { apiRouter } from './routes/index.js';

const app = express();

// Normalizar origen removiendo trailing slash si existe
const configuredOrigin = (env.frontendUrl || process.env.FRONTEND_URL || '').replace(/\/$/, '');

// CORS: Soporta Vercel (producción y previews), localhost y la variable configurada
app.use(
  cors({
    origin: (origin, callback) => {
      // Peticiones sin header Origin (curl, server-to-server, healthchecks)
      if (!origin) {
        return callback(null, true);
      }

      if (
        origin === configuredOrigin ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost')
      ) {
        return callback(null, true);
      }

      return callback(new Error(`CORS bloqueado para origen: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  }),
);

app.use(express.json());

// Rutas API bajo /api/*
app.use('/api', apiRouter);

// 404 para rutas no encontradas
app.use((_req, res) => {
  res.status(404).json({ message: 'Not found' });
});

// Manejador central de errores (HttpError → status + { message, code })
app.use(errorHandler);

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`[gym-api] listening on http://localhost:${env.port} (${env.nodeEnv})`);
});