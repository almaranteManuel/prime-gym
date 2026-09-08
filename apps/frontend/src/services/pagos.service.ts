import type { CreatePagoDTO, RegistrarPagoResult } from '@gym/shared';
import { api } from './api.js';

/** POST /api/pagos — pago total que crea/extiende la membresía +1 mes. */
export async function registrarPagoRequest(input: CreatePagoDTO): Promise<RegistrarPagoResult> {
  const res = await api.post<RegistrarPagoResult>('/pagos', input);
  return res.data;
}
