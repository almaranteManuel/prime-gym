import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import type { IMembresia, IPago } from '@gym/shared';
import { fetchPagosPorSocio } from '../services/pagos.service.js';
import { fetchMembresiasPorSocio } from '../services/membresias.service.js';

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
 * Historial de un socio: pagos y membresías.
 * Si `socioId` es null no pide nada (aún no hay perfil seleccionado).
 * El backend ya devuelve ambas listas ordenadas (más recientes primero).
 */
export function useSocioHistorial(socioId: string | null) {
  const [pagos, setPagos] = useState<IPago[]>([]);
  const [membresias, setMembresias] = useState<IMembresia[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    if (!socioId) {
      setPagos([]);
      setMembresias([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [pagosData, membresiasData] = await Promise.all([
        fetchPagosPorSocio(socioId),
        fetchMembresiasPorSocio(socioId),
      ]);
      if (!Array.isArray(pagosData) || !Array.isArray(membresiasData)) {
        setPagos([]);
        setMembresias([]);
        setError('Respuesta inesperada de la API: se esperaba el historial del socio');
        return;
      }
      setPagos(pagosData);
      setMembresias(membresiasData);
    } catch (err: unknown) {
      setPagos([]);
      setMembresias([]);
      setError(toErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [socioId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  return { pagos, membresias, loading, error, refresh, clearError };
}

export type UseSocioHistorial = ReturnType<typeof useSocioHistorial>;
