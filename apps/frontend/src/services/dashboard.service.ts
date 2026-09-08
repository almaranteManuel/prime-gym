import type { IDashboardHoy } from '@gym/shared';
import { api } from './api.js';

/** GET /api/dashboard/hoy — panel del día en la zona del gimnasio. */
export async function fetchDashboardHoy(): Promise<IDashboardHoy> {
  const res = await api.get<unknown>('/dashboard/hoy');
  const payload: unknown = res.data;
  if (
    payload !== null &&
    typeof payload === 'object' &&
    typeof (payload as { fecha?: unknown }).fecha === 'string' &&
    Array.isArray((payload as { turnos?: unknown }).turnos)
  ) {
    return payload as IDashboardHoy;
  }
  throw new Error('Respuesta inesperada de la API: se esperaba el panel del día');
}
