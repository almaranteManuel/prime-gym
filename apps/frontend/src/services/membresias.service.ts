import type { IMembresia } from '@gym/shared';
import { api } from './api.js';

/** GET /api/socios/:id/membresias — historial de membresías del socio (vigencia reciente primero). */
export async function fetchMembresiasPorSocio(socioId: string): Promise<IMembresia[]> {
  const res = await api.get<unknown>(`/socios/${encodeURIComponent(socioId)}/membresias`);
  const payload: unknown = res.data;
  if (Array.isArray(payload)) return payload as IMembresia[];
  if (payload !== null && typeof payload === 'object' && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: IMembresia[] }).data;
  }
  throw new Error('Respuesta inesperada de la API: se esperaba una lista de membresías');
}
