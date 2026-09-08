import { useEffect, useState } from 'react';
import type { ApiHealthResponse } from '@gym/shared';
import { api } from '../services/api.js';

type Status = { state: 'loading' } | { state: 'ok'; data: ApiHealthResponse } | { state: 'error'; message: string };

/**
 * Componente de ejemplo: consume GET /api/health
 * y demuestra la importación del tipo compartido @gym/shared.
 */
export function ApiStatus() {
  const [status, setStatus] = useState<Status>({ state: 'loading' });

  useEffect(() => {
    let cancelled = false;
    api
      .get<ApiHealthResponse>('/health')
      .then((res) => {
        if (!cancelled) setStatus({ state: 'ok', data: res.data });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setStatus({
            state: 'error',
            message: err instanceof Error ? err.message : 'No se pudo contactar a la API',
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (status.state === 'loading') return <p>Conectando con la API…</p>;
  if (status.state === 'error')
    return (
      <p role="alert">
        API no disponible: {status.message} <br />
        <small>
          Revisa <code>VITE_API_URL</code> y que <code>npm run dev:api</code> esté corriendo.
        </small>
      </p>
    );
  return (
    <p>
      API conectada: <strong>{status.data.service}</strong> · {status.data.status} ·{' '}
      <small>{new Date(status.data.timestamp).toLocaleTimeString()}</small>
    </p>
  );
}
