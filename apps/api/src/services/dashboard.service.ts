import type { DiaSemana, IDashboardHoy, IDashboardReserva, IDashboardTurno } from '@gym/shared';
import { prisma } from '../config/prisma.js';
import { hoyEnBuenosAires } from '../config/timezone.js';

/**
 * Panel del día: turnos del día de la semana vigente (zona del gimnasio),
 * ordenados por horaInicio, con los alumnos del grupo y los datos básicos
 * del socio (nombre + problemas de salud) anidados. Los grupos son
 * semanales fijos: no se filtra por fecha.
 *
 * Acepta `now` para tests deterministas (TESTER.md §13).
 */
export async function getDashboardHoy(now: Date = new Date()): Promise<IDashboardHoy> {
  const { dia, fechaStr } = hoyEnBuenosAires(now);

  const turnos = await prisma.turno.findMany({
    where: { dia },
    orderBy: { horaInicio: 'asc' },
    include: {
      reservas: {
        include: {
          socio: { select: { id: true, nombre: true, dni: true, patologias: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  return {
    fecha: fechaStr,
    dia,
    turnos: turnos.map(
      (t): IDashboardTurno => ({
        id: t.id,
        dia: t.dia as DiaSemana,
        horaInicio: t.horaInicio,
        cupoMax: t.cupoMax,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        ocupados: t.reservas.length,
        reservas: t.reservas.map(
          (r): IDashboardReserva => ({
            id: r.id,
            socioId: r.socioId,
            turnoId: r.turnoId,
            createdAt: r.createdAt.toISOString(),
            socio: r.socio,
          }),
        ),
      }),
    ),
  };
}
