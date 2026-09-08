import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import type { CreatePagoDTO, CreateSocioDTO, ISocio, RegistrarPagoResult, UpdateSocioDTO } from '@gym/shared';
import {
  createSocioRequest,
  deleteSocioRequest,
  fetchSocios,
  updateSocioRequest,
} from '../services/socios.service.js';
import { registrarPagoRequest } from '../services/pagos.service.js';

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
 * Estado y operaciones de socios.
 * La lista incluye activos e inactivos (`estado=todos`); la página filtra
 * por tabs según `socio.activo`. Encapsula las peticiones HTTP y expone
 * carga/error para la UI.
 */
export function useSocios() {
  const [socios, setSocios] = useState<ISocio[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSocios('todos');
      if (!Array.isArray(data)) {
        setSocios([]);
        setError('Respuesta inesperada de la API: se esperaba una lista de socios');
        return;
      }
      setSocios(data);
    } catch (err: unknown) {
      setSocios([]);
      setError(toErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = useCallback(async (input: CreateSocioDTO): Promise<ISocio | null> => {
    setError(null);
    try {
      const created = await createSocioRequest(input);
      setSocios((prev) => [created, ...prev]);
      return created;
    } catch (err: unknown) {
      const message = toErrorMessage(err);
      setError(message);
      return null;
    }
  }, []);

  const update = useCallback(async (id: string, input: UpdateSocioDTO): Promise<ISocio | null> => {
    setError(null);
    try {
      const updated = await updateSocioRequest(id, input);
      setSocios((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      return updated;
    } catch (err: unknown) {
      const message = toErrorMessage(err);
      setError(message);
      return null;
    }
  }, []);

  /** Baja lógica: marca al socio como inactivo (permanece visible en la tab Inactivos). */
  const remove = useCallback(async (id: string): Promise<boolean> => {
    setError(null);
    try {
      const deleted = await deleteSocioRequest(id);
      setSocios((prev) => prev.map((s) => (s.id === deleted.id ? deleted : s)));
      return true;
    } catch (err: unknown) {
      const message = toErrorMessage(err);
      setError(message);
      return false;
    }
  }, []);

  /**
   * Registra un pago total y refresca la lista (la membresía cambia y un
   * socio inactivo puede reactivarse).
   */
  const pay = useCallback(async (input: CreatePagoDTO): Promise<RegistrarPagoResult | null> => {
    setError(null);
    try {
      const result = await registrarPagoRequest(input);
      await refresh();
      return result;
    } catch (err: unknown) {
      const message = toErrorMessage(err);
      setError(message);
      return null;
    }
  }, [refresh]);

  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  return { socios, loading, error, refresh, create, update, remove, pay, clearError };
}

export type UseSocios = ReturnType<typeof useSocios>;
