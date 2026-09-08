import { prisma } from '../config/prisma.js';
import { HttpError } from '../utils/http-error.js';

function assertId(id: unknown): string {
  if (typeof id !== 'string' || !id.trim()) {
    throw new HttpError(400, 'El id es obligatorio', 'VALIDATION_ERROR');
  }
  return id.trim();
}

/**
 * Desasigna un alumno: elimina la reserva (baja de último momento).
 * - 400 si el id es vacío.
 * - 404 si la reserva no existe.
 */
export async function deleteReserva(id: string): Promise<void> {
  const reservaId = assertId(id);
  const existing = await prisma.reserva.findUnique({ where: { id: reservaId } });
  if (!existing) throw new HttpError(404, 'Reserva no encontrada', 'RESERVA_NO_ENCONTRADA');
  await prisma.reserva.delete({ where: { id: reservaId } });
}
