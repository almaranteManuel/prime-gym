import type { DiaSemana, ICobranzaItem, IDashboardHoy, IDashboardReserva, IDashboardTurno, IResumenDashboard, MetodoPago } from '@gym/shared';
import { prisma } from '../config/prisma.js';
import { addDaysUTC } from '../utils/dates.js';
import { hoyEnBuenosAires, mesActualEnBuenosAires, rangoMesEnBuenosAires } from '../config/timezone.js';
import { HttpError } from '../utils/http-error.js';

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

/**
 * Resumen del panel: socios, pagos del mes y cobranza (vencidas + por
 * vencer en ≤7 días, sin importes). `mes` es "YYYY-MM"; por defecto el
 * mes vigente en el gimnasio. Acepta `now` para tests deterministas.
 */
export async function getResumenDashboard(mesRaw: unknown, now: Date = new Date()): Promise<IResumenDashboard> {
  const mes = mesRaw === undefined ? mesActualEnBuenosAires(now) : String(mesRaw);
  const rango = rangoMesEnBuenosAires(mes);
  if (!rango) {
    throw new HttpError(400, 'Parámetro mes inválido. Formato: YYYY-MM', 'VALIDATION_ERROR');
  }
  const hoy = hoyEnBuenosAires(now).fecha;
  const limiteCobranza = addDaysUTC(hoy, 7);

  const [activos, total, pagosPorMetodo, vigencias] = await Promise.all([
    prisma.socio.count({ where: { activo: true } }),
    prisma.socio.count(),
    prisma.pago.groupBy({
      by: ['metodo'],
      where: { fechaPago: { gte: rango.inicio, lt: rango.fin } },
      _sum: { monto: true },
      _count: { _all: true },
    }),
    prisma.membresia.groupBy({
      by: ['socioId'],
      _max: { fechaFin: true },
    }),
  ]);

  const porMetodo = {
    EFECTIVO: { cantidad: 0, total: 0 },
    TRANSFERENCIA: { cantidad: 0, total: 0 },
  } satisfies Record<MetodoPago, { cantidad: number; total: number }>;
  for (const grupo of pagosPorMetodo) {
    porMetodo[grupo.metodo].cantidad = grupo._count._all;
    porMetodo[grupo.metodo].total = grupo._sum.monto?.toNumber() ?? 0;
  }

  const porVencerIds = vigencias
    .filter((v) => v._max.fechaFin !== null && v._max.fechaFin <= limiteCobranza)
    .map((v) => v.socioId);
  const finPorSocio = new Map(vigencias.map((v) => [v.socioId, v._max.fechaFin as Date]));
  const sociosCobranza = porVencerIds.length > 0
    ? await prisma.socio.findMany({
        where: { id: { in: porVencerIds }, activo: true },
        select: { id: true, nombre: true, dni: true },
      })
    : [];

  const cobranza: ICobranzaItem[] = sociosCobranza
    .map((s) => {
      const fechaFin = finPorSocio.get(s.id) as Date;
      return {
        socioId: s.id,
        nombre: s.nombre,
        dni: s.dni,
        fechaFin: fechaFin.toISOString().slice(0, 10),
        estado: fechaFin < hoy ? 'vencida' : 'porVencer',
      } as ICobranzaItem;
    })
    .sort((a, b) => a.fechaFin.localeCompare(b.fechaFin));

  const cantidad = porMetodo.EFECTIVO.cantidad + porMetodo.TRANSFERENCIA.cantidad;
  const totalCobrado = porMetodo.EFECTIVO.total + porMetodo.TRANSFERENCIA.total;

  return {
    mes: rango.mes,
    sociosActivos: activos,
    sociosTotal: total,
    pagosMes: { mes: rango.mes, cantidad, total: totalCobrado, porMetodo },
    cobranza,
  };
}
