import type { CreatePagoDTO, IPago, RegistrarPagoResult } from '@gym/shared';
import { api } from './api.js';

/** POST /api/pagos — pago total que crea/extiende la membresía +1 mes. */
export async function registrarPagoRequest(input: CreatePagoDTO): Promise<RegistrarPagoResult> {
  const res = await api.post<RegistrarPagoResult>('/pagos', input);
  return res.data;
}

/** GET /api/socios/:id/pagos — historial de pagos del socio (más recientes primero). */
export async function fetchPagosPorSocio(socioId: string): Promise<IPago[]> {
  const res = await api.get<unknown>(`/socios/${encodeURIComponent(socioId)}/pagos`);
  const payload: unknown = res.data;
  if (Array.isArray(payload)) return payload as IPago[];
  if (payload !== null && typeof payload === 'object' && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: IPago[] }).data;
  }
  throw new Error('Respuesta inesperada de la API: se esperaba una lista de pagos');
}
