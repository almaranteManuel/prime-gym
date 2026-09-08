import { api } from './api.js';

/** DELETE /api/reservas/:id — desasigna un alumno (baja de último momento). */
export async function deleteReservaRequest(id: string): Promise<void> {
  await api.delete(`/reservas/${encodeURIComponent(id)}`);
}
