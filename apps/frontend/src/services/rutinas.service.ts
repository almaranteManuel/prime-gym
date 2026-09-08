import type { CreateRutinaDTO, IRutina } from '@gym/shared';
import { api } from './api.js';

/** POST /api/rutinas — crea y asigna una rutina a un socio. */
export async function createRutinaRequest(input: CreateRutinaDTO): Promise<IRutina> {
  const res = await api.post<IRutina>('/rutinas', input);
  return res.data;
}

/** GET /api/rutinas/socio/:socioId — rutinas de un alumno. */
export async function fetchRutinasPorSocio(socioId: string): Promise<IRutina[]> {
  const res = await api.get<unknown>(`/rutinas/socio/${encodeURIComponent(socioId)}`);
  const payload: unknown = res.data;
  if (Array.isArray(payload)) return payload as IRutina[];
  if (payload !== null && typeof payload === 'object' && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: IRutina[] }).data;
  }
  throw new Error('Respuesta inesperada de la API: se esperaba una lista de rutinas');
}
