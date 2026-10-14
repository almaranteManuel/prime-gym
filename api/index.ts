import type { Request, Response } from 'express';
import { app } from '../apps/api/src/app.js';
import { ensureDefaultAdmin } from '../apps/api/src/services/auth.service.js';

/**
 * Serverless Function que expone la API Express completa.
 * `vercel.json` redirige `/api/:path*` hacia esta función; Express recibe
 * la URL original y despacha en `apiRouter` (rutas bajo `/api/*`).
 *
 * No hay fase de arranque en serverless: el seed del admin inicial se
 * ejecuta una sola vez por instancia fría. Es idempotente (ignora P2002 por
 * username duplicado) y sus errores se registran sin tumbar el request.
 */
let bootstrapPromise: Promise<void> | null = null;

function bootstrapOnce(): Promise<void> {
  bootstrapPromise ??= ensureDefaultAdmin().catch((error: unknown) => {
    // eslint-disable-next-line no-console
    console.error('[gym-api] bootstrap skipped:', error);
  });
  return bootstrapPromise;
}

export default async function handler(req: Request, res: Response): Promise<void> {
  await bootstrapOnce();
  app(req, res);
}
