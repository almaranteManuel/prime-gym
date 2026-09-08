import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import type { AsignarTurnoResult, CreateTurnoDTO, ITurnoConOcupacion } from '@gym/shared';
import {
  asignarSocioRequest,
  createTurnoRequest,
  deleteTurnoRequest,
  fetchTurnos,
} from '../services/turnos.service.js';
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
 * Estado y operaciones de turnos (grupos horarios).
 * Encapsula las peticiones HTTP y expone carga/error para la UI.
 * Tras crear, eliminar o asignar se refresca la lista para reflejar
 * la ocupación real que calcula el backend.
 */
export function useTurnos() {
  const [turnos, setTurnos] = useState<ITurnoConOcupacion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTurnos();
      if (!Array.isArray(data)) {
        setTurnos([]);
        setError('Respuesta inesperada de la API: se esperaba una lista de turnos');
        return;
      }
      setTurnos(data);
    } catch (err: unknown) {
      setTurnos([]);
      setError(toErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = useCallback(async (input: CreateTurnoDTO): Promise<boolean> => {
    setError(null);
    try {
      await createTurnoRequest(input);
      await refresh();
      return true;
    } catch (err: unknown) {
      setError(toErrorMessage(err));
      return false;
    }
  }, [refresh]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    setError(null);
    try {
      await deleteTurnoRequest(id);
      await refresh();
      return true;
    } catch (err: unknown) {
      setError(toErrorMessage(err));
      return false;
    }
  }, [refresh]);

  /** Asigna un socio al turno; el backend valida socio activo y cupo. */
  const assign = useCallback(async (turnoId: string, socioId: string): Promise<AsignarTurnoResult | null> => {
    setError(null);
    try {
      const result = await asignarSocioRequest(turnoId, { socioId });
      await refresh();
      return result;
    } catch (err: unknown) {
      setError(toErrorMessage(err));
      return null;
    }
  }, [refresh]);

  /** Quita un alumno del turno y refresca la ocupación. */
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

  return { turnos, loading, error, refresh, create, remove, assign, unassign, clearError };
}

export type UseTurnos = ReturnType<typeof useTurnos>;
