import type { CreateSocioDTO, ISocio, UpdateSocioDTO } from '@gym/shared';
import { api } from './api.js';

/**
 * Operaciones HTTP de Socios.
 * Los componentes/hooks usan estas funciones en lugar de construir URLs.
 *
 * Nota: la respuesta se valida en runtime (nunca se confía en que el
 * payload sea un array). Si el backend no está corriendo y Vite devuelve
 * el index.html como fallback, el payload será un string y se rechaza
 * con un error claro en lugar de romper la UI con `socios.map`.
 */
export type EstadoSociosFiltro = 'activos' | 'inactivos' | 'todos';

export async function fetchSocios(estado: EstadoSociosFiltro = 'todos'): Promise<ISocio[]> {
  const res = await api.get<unknown>('/socios', { params: { estado } });
  const payload: unknown = res.data;
  if (Array.isArray(payload)) return payload as ISocio[];
  if (payload !== null && typeof payload === 'object' && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: ISocio[] }).data;
  }
  throw new Error('Respuesta inesperada de la API: se esperaba una lista de socios');
}

export async function createSocioRequest(input: CreateSocioDTO): Promise<ISocio> {
  const res = await api.post<ISocio>('/socios', input);
  return res.data;
}

export async function updateSocioRequest(id: string, input: UpdateSocioDTO): Promise<ISocio> {
  const res = await api.put<ISocio>(`/socios/${encodeURIComponent(id)}`, input);
  return res.data;
}

export async function deleteSocioRequest(id: string): Promise<ISocio> {
  const res = await api.delete<ISocio>(`/socios/${encodeURIComponent(id)}`);
  return res.data;
}
