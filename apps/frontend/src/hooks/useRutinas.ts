import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import type { CreateRutinaDTO, IRutina } from '@gym/shared';
import { createRutinaRequest, fetchRutinasPorSocio } from '../services/rutinas.service.js';

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
 * Rutinas de un socio: listado y alta.
 * Si `socioId` es null no pide nada (el modal aún no eligió alumno).
 */
export function useRutinas(socioId: string | null) {
  const [rutinas, setRutinas] = useState<IRutina[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    if (!socioId) {
      setRutinas([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRutinasPorSocio(socioId);
      if (!Array.isArray(data)) {
        setRutinas([]);
        setError('Respuesta inesperada de la API: se esperaba una lista de rutinas');
        return;
      }
      setRutinas(data);
    } catch (err: unknown) {
      setRutinas([]);
      setError(toErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [socioId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = useCallback(async (input: CreateRutinaDTO): Promise<IRutina | null> => {
    setError(null);
    try {
      const created = await createRutinaRequest(input);
      await refresh();
      return created;
    } catch (err: unknown) {
      setError(toErrorMessage(err));
      return null;
    }
  }, [refresh]);

  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  return { rutinas, loading, error, refresh, create, clearError };
}

export type UseRutinas = ReturnType<typeof useRutinas>;
