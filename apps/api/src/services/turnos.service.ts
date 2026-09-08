import { Prisma, type Turno } from '@prisma/client';
import type {
  AsignarTurnoDTO,
  AsignarTurnoResult,
  CreateTurnoDTO,
  DiaSemana,
  IReservaConSocio,
  ITurno,
  ITurnoConOcupacion,
  UpdateTurnoDTO,
} from '@gym/shared';
import { DIAS_SEMANA, TURNO_CUPO_MAX, TURNO_CUPO_MIN } from '@gym/shared';
import { prisma } from '../config/prisma.js';
import { HttpError } from '../utils/http-error.js';

/** "HH:mm" en 24 h (ej. 18:00). */
export const TURNO_HORA_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const CUPO_DEFAULT = 5 as const;

// ---------------------------------------------------------------------------
// Validadores puros (testeables sin Prisma ni Express — ver TESTER.md §3)
// ---------------------------------------------------------------------------

export function validarDia(value: unknown): DiaSemana {
  if (typeof value !== 'string' || !(DIAS_SEMANA as readonly string[]).includes(value)) {
    throw new HttpError(400, `Día inválido. Valores permitidos: ${DIAS_SEMANA.join(', ')}`, 'VALIDATION_ERROR');
  }
  return value as DiaSemana;
}

export function validarHoraInicio(value: unknown): string {
  if (typeof value !== 'string' || !TURNO_HORA_REGEX.test(value)) {
    throw new HttpError(400, 'horaInicio debe tener formato HH:mm válido (00:00–23:59)', 'VALIDATION_ERROR');
  }
  return value;
}

export function validarCupo(value: unknown): number {
  if (value === undefined) return CUPO_DEFAULT;
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new HttpError(400, 'cupoMax debe ser un número entero', 'VALIDATION_ERROR');
  }
  if (value < TURNO_CUPO_MIN || value > TURNO_CUPO_MAX) {
    throw new HttpError(
      400,
      `cupoMax debe estar entre ${TURNO_CUPO_MIN} y ${TURNO_CUPO_MAX}`,
      'VALIDATION_ERROR',
    );
  }
  return value;
}

/** Regla de negocio: hay lugar si los ocupados no alcanzan el cupo máximo. */
export function hayCupo(ocupados: number, cupoMax: number): boolean {
  return ocupados < cupoMax;
}

function assertId(id: unknown): string {
  if (typeof id !== 'string' || !id.trim()) {
    throw new HttpError(400, 'El id es obligatorio', 'VALIDATION_ERROR');
  }
  return id.trim();
}

function toTurnoDTO(t: Turno): ITurno {
  return {
    id: t.id,
    dia: t.dia as DiaSemana,
    horaInicio: t.horaInicio,
    cupoMax: t.cupoMax,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

/**
 * Lista turnos con su ocupación (un alumno anotado integra el grupo
 * todas las semanas). Ordenados por día de semana y hora.
 */
export async function listTurnos(): Promise<ITurnoConOcupacion[]> {
  const turnos = await prisma.turno.findMany({
    include: {
      reservas: {
        include: { socio: { select: { id: true, nombre: true, dni: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  const ordenDia = new Map<string, number>(DIAS_SEMANA.map((d, i) => [d, i]));
  turnos.sort((a, b) => (ordenDia.get(a.dia) ?? 0) - (ordenDia.get(b.dia) ?? 0) || a.horaInicio.localeCompare(b.horaInicio));

  return turnos.map((t) => ({
    ...toTurnoDTO(t),
    ocupados: t.reservas.length,
    reservas: t.reservas.map((r): IReservaConSocio => ({
      id: r.id,
      socioId: r.socioId,
      turnoId: r.turnoId,
      createdAt: r.createdAt.toISOString(),
      socio: r.socio,
    })),
  }));
}

/**
 * Crea un turno (franja semanal recurrente de 1 hora).
 * - 400 si día/hora/cupo son inválidos.
 * - 409 si ya existe un turno ese día a esa hora.
 */
export async function createTurno(input: CreateTurnoDTO): Promise<ITurno> {
  if (input === null || typeof input !== 'object') {
    throw new HttpError(400, 'El cuerpo de la petición es inválido', 'VALIDATION_ERROR');
  }
  const dia = validarDia(input.dia);
  const horaInicio = validarHoraInicio(input.horaInicio);
  const cupoMax = validarCupo(input.cupoMax);

  try {
    const turno = await prisma.turno.create({ data: { dia, horaInicio, cupoMax } });
    return toTurnoDTO(turno);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new HttpError(409, `Ya existe un turno los ${dia} a las ${horaInicio}`, 'TURNO_DUPLICADO');
    }
    throw err;
  }
}

/**
 * Actualiza un turno.
 * - 400 si no hay campos válidos o son inválidos.
 * - 404 si el turno no existe.
 * - 409 si el (día, hora) resultante ya pertenece a otro turno.
 */
export async function updateTurno(id: string, input: UpdateTurnoDTO): Promise<ITurno> {
  const turnoId = assertId(id);
  if (input === null || typeof input !== 'object') {
    throw new HttpError(400, 'El cuerpo de la petición es inválido', 'VALIDATION_ERROR');
  }

  const data: { dia?: DiaSemana; horaInicio?: string; cupoMax?: number } = {};
  if (input.dia !== undefined) data.dia = validarDia(input.dia);
  if (input.horaInicio !== undefined) data.horaInicio = validarHoraInicio(input.horaInicio);
  if (input.cupoMax !== undefined) data.cupoMax = validarCupo(input.cupoMax);

  if (Object.keys(data).length === 0) {
    throw new HttpError(400, 'No hay campos válidos para actualizar', 'VALIDATION_ERROR');
  }

  const existing = await prisma.turno.findUnique({ where: { id: turnoId } });
  if (!existing) throw new HttpError(404, 'Turno no encontrado', 'TURNO_NO_ENCONTRADO');

  try {
    const turno = await prisma.turno.update({ where: { id: turnoId }, data });
    return toTurnoDTO(turno);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new HttpError(409, 'Ya existe otro turno en ese día y horario', 'TURNO_DUPLICADO');
    }
    throw err;
  }
}

/**
 * Elimina un turno sin reservas.
 * - 404 si no existe.
 * - 409 si tiene reservas asociadas (Restrict).
 */
export async function deleteTurno(id: string): Promise<void> {
  const turnoId = assertId(id);
  const existing = await prisma.turno.findUnique({ where: { id: turnoId } });
  if (!existing) throw new HttpError(404, 'Turno no encontrado', 'TURNO_NO_ENCONTRADO');

  try {
    await prisma.turno.delete({ where: { id: turnoId } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
      throw new HttpError(409, 'El turno tiene alumnos asignados y no puede eliminarse', 'TURNO_CON_RESERVAS');
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Asignación de alumnos
// ---------------------------------------------------------------------------

/**
 * Asigna un socio a un turno (grupo semanal fijo), en transacción:
 * - 404 si el turno o el socio no existen.
 * - 400 si el socio está inactivo (solo activos).
 * - 400 si el cupo del turno ya está lleno.
 * - 409 si el socio ya integra ese turno.
 */
export async function asignarSocioATurno(turnoId: string, input: AsignarTurnoDTO): Promise<AsignarTurnoResult> {
  const id = assertId(turnoId);
  if (input === null || typeof input !== 'object') {
    throw new HttpError(400, 'El cuerpo de la petición es inválido', 'VALIDATION_ERROR');
  }
  const socioId = assertId(input.socioId);

  return prisma.$transaction(async (tx) => {
    const turno = await tx.turno.findUnique({ where: { id } });
    if (!turno) throw new HttpError(404, 'Turno no encontrado', 'TURNO_NO_ENCONTRADO');

    const socio = await tx.socio.findUnique({ where: { id: socioId } });
    if (!socio) throw new HttpError(404, 'Socio no encontrado', 'SOCIO_NO_ENCONTRADO');
    if (!socio.activo) {
      throw new HttpError(400, 'Solo se pueden asignar socios activos', 'SOCIO_INACTIVO');
    }

    const ocupados = await tx.reserva.count({ where: { turnoId: id } });
    if (!hayCupo(ocupados, turno.cupoMax)) {
      throw new HttpError(400, `Cupo lleno (${ocupados}/${turno.cupoMax} ocupados)`, 'CUPO_LLENO');
    }

    try {
      const reserva = await tx.reserva.create({
        data: { socioId, turnoId: id },
      });
      return {
        reserva: {
          id: reserva.id,
          socioId: reserva.socioId,
          turnoId: reserva.turnoId,
          createdAt: reserva.createdAt.toISOString(),
        },
        ocupados: ocupados + 1,
        cupoMax: turno.cupoMax,
      };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new HttpError(409, 'El socio ya está asignado a este turno', 'RESERVA_DUPLICADA');
      }
      throw err;
    }
  });
}
