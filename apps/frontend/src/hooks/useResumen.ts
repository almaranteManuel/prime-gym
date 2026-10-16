import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import type { IResumenDashboard } from '@gym/shared';
import { fetchResumenDashboard } from '../services/dashboard.service.js';

function toErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: unknown } | undefined;
    if (typeof data?.message === 'string' && data.message.trim()) return data.message;
    if (err.message) return err.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return 'Error inesperado';
}

/**
 * Resumen del panel (socios, pagos del mes con filtro, cobranza).
 * Recarga al cambiar `mes` ("YYYY-MM").
 */
export function useResumen(mes: string) {
  const [resumen, setResumen] = useState<IResumenDashboard | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchResumenDashboard(mes);
      setResumen(data);
    } catch (err: unknown) {
      setResumen(null);
      setError(toErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [mes]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { resumen, loading, error, refresh };
}

export type UseResumen = ReturnType<typeof useResumen>;
