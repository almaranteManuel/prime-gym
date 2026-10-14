import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { errorHandler } from './middlewares/error-handler.js';
import { apiRouter } from './routes/index.js';

/**
 * App Express compartida entre el servidor tradicional (local/Docker,
 * ver `index.ts`) y la Serverless Function de Vercel (ver `/api/index.ts`).
 * Este módulo NO debe abrir puertos ni ejecutar seeds: solo construye el app.
 */
export const app = express();

// Orígenes explícitos: FRONTEND_URL configurada + URL del despliegue Vercel.
const vercelUrl = (process.env.VERCEL_URL ?? '').replace(/\/$/, '');
const allowedOrigins = new Set(
  [env.frontendUrl, process.env.FRONTEND_URL ?? '', vercelUrl ? `https://${vercelUrl}` : '']
    .map((origin) => origin.replace(/\/$/, ''))
    .filter((origin) => origin.length > 0),
);

function isLocalhost(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.localhost');
  } catch {
    return false;
  }
}

function isVercelPreview(origin: string): boolean {
  try {
    return new URL(origin).hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
}

// CORS: en despliegue unificado frontend y API comparten origen (el navegador
// igual envía `Origin`). Se permite la URL configurada, el dominio Vercel
// actual, previews `*.vercel.app` y localhost para desarrollo.
app.use(
  cors({
    origin: (origin, callback) => {
      // Peticiones sin header Origin (curl, server-to-server, healthchecks).
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.has(origin) || isVercelPreview(origin) || isLocalhost(origin)) {
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

export default app;
