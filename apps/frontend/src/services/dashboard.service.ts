import type { IDashboardHoy, IResumenDashboard } from '@gym/shared';
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

/** GET /api/dashboard/resumen?mes=YYYY-MM — socios, pagos del mes y cobranza. */
export async function fetchResumenDashboard(mes: string): Promise<IResumenDashboard> {
  const res = await api.get<unknown>('/dashboard/resumen', { params: { mes } });
  const payload: unknown = res.data;
  if (
    payload !== null &&
    typeof payload === 'object' &&
    typeof (payload as { mes?: unknown }).mes === 'string' &&
    typeof (payload as { sociosActivos?: unknown }).sociosActivos === 'number' &&
    typeof (payload as { sociosTotal?: unknown }).sociosTotal === 'number' &&
    (payload as { pagosMes?: unknown }).pagosMes !== null &&
    typeof (payload as { pagosMes?: unknown }).pagosMes === 'object' &&
    Array.isArray((payload as { cobranza?: unknown }).cobranza)
  ) {
    return payload as IResumenDashboard;
  }
  throw new Error('Respuesta inesperada de la API: se esperaba el resumen del panel');
}
