import { app } from './app.js';
import { env } from './config/env.js';
import { ensureDefaultAdmin } from './services/auth.service.js';

/**
 * Entrada para ejecución tradicional (local `npm run dev` y Docker).
 * En Vercel se usa `/api/index.ts`, que reutiliza `./app.js` sin `listen`.
 */
async function start(): Promise<void> {
  await ensureDefaultAdmin();
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[gym-api] listening on http://localhost:${env.port} (${env.nodeEnv})`);
  });
}

start().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error('[gym-api] failed to start:', error);
  process.exitCode = 1;
});
