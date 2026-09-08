import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { errorHandler } from './middlewares/error-handler.js';
import { apiRouter } from './routes/index.js';

const app = express();

// CORS: solo el frontend (+ mismo origen en local). Ajusta FRONTEND_URL en .env.
app.use(
  cors({
    origin: [env.frontendUrl],
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
