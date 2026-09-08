import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import type { IDashboardHoy } from '@gym/shared';
import { fetchDashboardHoy } from '../services/dashboard.service.js';
import { deleteReservaRequest } from '../services/reservas.service.js';

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
 * Panel del día: turnos de hoy con reservas y desasignación rápida.
 * Encapsula las peticiones HTTP y expone carga/error para la UI.
 */
export function useDashboard() {
  const [dashboard, setDashboard] = useState<IDashboardHoy | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDashboardHoy();
      setDashboard(data);
    } catch (err: unknown) {
      setDashboard(null);
      setError(toErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /** Desasigna un alumno y refresca para reflejar el cupo liberado. */
  const unassign = useCallback(async (reservaId: string): Promise<boolean> => {
    setError(null);
    try {
      await deleteReservaRequest(reservaId);
      await refresh();
      return true;
    } catch (err: unknown) {
      setError(toErrorMessage(err));
      return false;
    }
  }, [refresh]);

  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  return { dashboard, loading, error, refresh, unassign, clearError };
}

export type UseDashboard = ReturnType<typeof useDashboard>;
