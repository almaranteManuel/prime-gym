import type {
  AsignarTurnoDTO,
  AsignarTurnoResult,
  CreateTurnoDTO,
  ITurno,
  ITurnoConOcupacion,
} from '@gym/shared';
import { api } from './api.js';

/**
 * Operaciones HTTP de Turnos.
 * Los componentes/hooks usan estas funciones en lugar de construir URLs.
 */
export async function fetchTurnos(): Promise<ITurnoConOcupacion[]> {
  const res = await api.get<unknown>('/turnos');
  const payload: unknown = res.data;
  if (Array.isArray(payload)) return payload as ITurnoConOcupacion[];
  if (payload !== null && typeof payload === 'object' && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: ITurnoConOcupacion[] }).data;
  }
  throw new Error('Respuesta inesperada de la API: se esperaba una lista de turnos');
}

export async function createTurnoRequest(input: CreateTurnoDTO): Promise<ITurno> {
  const res = await api.post<ITurno>('/turnos', input);
  return res.data;
}

export async function deleteTurnoRequest(id: string): Promise<void> {
  await api.delete(`/turnos/${encodeURIComponent(id)}`);
}

export async function asignarSocioRequest(turnoId: string, input: AsignarTurnoDTO): Promise<AsignarTurnoResult> {
  const res = await api.post<AsignarTurnoResult>(`/turnos/${encodeURIComponent(turnoId)}/asignar`, input);
  return res.data;
}
