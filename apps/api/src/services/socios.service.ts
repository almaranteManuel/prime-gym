import bcrypt from 'bcryptjs';
import { Prisma, type Socio } from '@prisma/client';
import type {
  CreateSocioDTO,
  CreateSocioWithAccessResult,
  IReserva,
  ISocio,
  UpdateSocioDTO,
} from '@gym/shared';
import { prisma } from '../config/prisma.js';
import { HttpError } from '../utils/http-error.js';
import { toDateOnlyString } from '../utils/dates.js';
import { hayCupo } from './turnos.service.js';

const BCRYPT_ROUNDS = 12;

const NOMBRE_MAX = 120;
const CELULAR_MAX = 40;
const DNI_MAX = 20;
const TEXTO_MAX = 2000;

function toSocioDTO(s: Socio): ISocio {
  return {
    id: s.id,
    nombre: s.nombre,
    celular: s.celular,
    dni: s.dni,
    patologias: s.patologias,
    objetivos: s.objetivos,
    activo: s.activo,
    diasEntrenamiento: s.diasEntrenamiento ?? null,
    fechaAlta: toDateOnlyString(s.fechaAlta),
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

function assertNonEmptyString(value: unknown, field: string, max: number): string {
  if (typeof value !== 'string') {
    throw new HttpError(400, `El campo ${field} debe ser un texto`, 'VALIDATION_ERROR');
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw new HttpError(400, `El campo ${field} es obligatorio`, 'VALIDATION_ERROR');
  }
  if (trimmed.length > max) {
    throw new HttpError(400, `El campo ${field} supera los ${max} caracteres`, 'VALIDATION_ERROR');
  }
  return trimmed;
}

function normalizeOptionalText(value: unknown, field: string): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') {
    throw new HttpError(400, `El campo ${field} debe ser un texto o null`, 'VALIDATION_ERROR');
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > TEXTO_MAX) {
    throw new HttpError(400, `El campo ${field} supera los ${TEXTO_MAX} caracteres`, 'VALIDATION_ERROR');
  }
  return trimmed;
}

function assertId(id: unknown): string {
  if (typeof id !== 'string' || !id.trim()) {
    throw new HttpError(400, 'El id es obligatorio', 'VALIDATION_ERROR');
  }
  return id.trim();
}

/**
 * Días por semana que planea asistir. Sin tope máximo (lo maneja el dueño):
 * solo se exige entero ≥ 1. `null`/`undefined` conservan el sentido de
 * "sin dato" (null lo borra en edición, undefined no toca el valor).
 */
export function normalizeDiasEntrenamiento(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    throw new HttpError(400, 'El campo diasEntrenamiento debe ser un entero mayor o igual a 1', 'VALIDATION_ERROR');
  }
  return value;
}

/** Filtro de listado por estado de baja lógica. */
export type EstadoSocios = 'activos' | 'inactivos' | 'todos';

/**
 * Lista socios según su estado.
 * Por defecto solo activos (la baja lógica queda excluida).
 */
export async function listSocios(estado: EstadoSocios = 'activos'): Promise<ISocio[]> {
  const socios = await prisma.socio.findMany({
    where: estado === 'todos' ? undefined : { activo: estado === 'activos' },
    orderBy: { createdAt: 'desc' },
  });
  return socios.map(toSocioDTO);
}

/**
 * Da de alta un socio nuevo (siempre activo; fechaAlta la asigna la BD),
 * en una misma transacción:
 *  1. crea el Socio,
 *  2. crea su Usuario ALUMNO (username = dni, clave inicial = dni hasheada
 *     con bcrypt; nunca se devuelve ni se loguea en texto plano),
 *  3. crea una Reserva por cada turnoId pedido (solo con cupo libre).
 * - 400 si faltan nombre/celular/dni, exceden longitudes o hay turnoIds inválidos.
 * - 404 si algún turno no existe.
 * - 400 (CUPO_LLENO) si algún turno está lleno: se revierte el alta completa.
 * - 409 (DNI_DUPLICADO) si el dni ya existe; 409 (USUARIO_EXISTENTE) si el
 *   username derivado del dni ya está en uso.
 */
export async function createSocio(input: CreateSocioDTO): Promise<CreateSocioWithAccessResult> {
  if (input === null || typeof input !== 'object') {
    throw new HttpError(400, 'El cuerpo de la petición es inválido', 'VALIDATION_ERROR');
  }
  const nombre = assertNonEmptyString(input.nombre, 'nombre', NOMBRE_MAX);
  const celular = assertNonEmptyString(input.celular, 'celular', CELULAR_MAX);
  const dni = assertNonEmptyString(input.dni, 'dni', DNI_MAX);
  const patologias = normalizeOptionalText(input.patologias, 'patologias') ?? null;
  const objetivos = normalizeOptionalText(input.objetivos, 'objetivos') ?? null;
  const diasEntrenamiento = normalizeDiasEntrenamiento(input.diasEntrenamiento) ?? null;
  const turnoIds = normalizeTurnoIds(input.turnoIds);

  const username = dni.toLowerCase();
  const passwordHash = await bcrypt.hash(dni, BCRYPT_ROUNDS);

  try {
    return await prisma.$transaction(async (tx) => {
      const socio = await tx.socio.create({
        data: { nombre, celular, dni, patologias, objetivos, diasEntrenamiento },
      });

      let usuario;
      try {
        usuario = await tx.usuario.create({
          data: { username, passwordHash, rol: 'ALUMNO', socioId: socio.id },
          select: { id: true, username: true, rol: true },
        });
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          throw new HttpError(409, `Ya existe un usuario con nombre ${username}`, 'USUARIO_EXISTENTE');
        }
        throw err;
      }

      const reservas: IReserva[] = [];
      for (const turnoId of turnoIds) {
        const turno = await tx.turno.findUnique({ where: { id: turnoId } });
        if (!turno) throw new HttpError(404, 'Turno no encontrado', 'TURNO_NO_ENCONTRADO');
        const ocupados = await tx.reserva.count({ where: { turnoId } });
        if (!hayCupo(ocupados, turno.cupoMax)) {
          throw new HttpError(400, `Cupo lleno en el turno ${turno.dia} ${turno.horaInicio} (${ocupados}/${turno.cupoMax} ocupados)`, 'CUPO_LLENO');
        }
        const reserva = await tx.reserva.create({ data: { socioId: socio.id, turnoId } });
        reservas.push({
          id: reserva.id,
          socioId: reserva.socioId,
          turnoId: reserva.turnoId,
          createdAt: reserva.createdAt.toISOString(),
        });
      }

      return {
        socio: toSocioDTO(socio),
        usuario: { id: usuario.id, username: usuario.username, rol: usuario.rol === 'ADMIN' ? 'admin' : 'alumno' },
        reservas,
        requiereCambioPassword: true as const,
      };
    });
  } catch (err) {
    if (err instanceof HttpError) throw err;
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new HttpError(409, `Ya existe un socio con dni ${dni}`, 'DNI_DUPLICADO');
    }
    throw err;
  }
}

/**
 * turnoIds del alta: array opcional de ids no vacíos, sin duplicados.
 * La disponibilidad se valida dentro de la transacción (no antes).
 */
function normalizeTurnoIds(value: unknown): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    throw new HttpError(400, 'El campo turnoIds debe ser un array de ids', 'VALIDATION_ERROR');
  }
  const ids: string[] = [];
  const vistos = new Set<string>();
  for (const raw of value) {
    if (typeof raw !== 'string' || !raw.trim()) {
      throw new HttpError(400, 'El campo turnoIds debe ser un array de ids', 'VALIDATION_ERROR');
    }
    const id = raw.trim();
    if (!vistos.has(id)) {
      vistos.add(id);
      ids.push(id);
    }
  }
  return ids;
}

/**
 * Actualiza los datos de un socio activo.
 * - 400 si el id es vacío, el cuerpo no trae campos válidos o hay datos inválidos.
 * - 404 si el socio no existe o está dado de baja.
 * - 409 si el nuevo dni ya pertenece a otro socio.
 */
export async function updateSocio(id: string, input: UpdateSocioDTO): Promise<ISocio> {
  const socioId = assertId(id);
  if (input === null || typeof input !== 'object') {
    throw new HttpError(400, 'El cuerpo de la petición es inválido', 'VALIDATION_ERROR');
  }

  const data: { nombre?: string; celular?: string; dni?: string; patologias?: string | null; objetivos?: string | null; diasEntrenamiento?: number | null } = {};

  if (input.nombre !== undefined) data.nombre = assertNonEmptyString(input.nombre, 'nombre', NOMBRE_MAX);
  if (input.celular !== undefined) data.celular = assertNonEmptyString(input.celular, 'celular', CELULAR_MAX);
  if (input.dni !== undefined) data.dni = assertNonEmptyString(input.dni, 'dni', DNI_MAX);
  if (input.patologias !== undefined) {
    const v = normalizeOptionalText(input.patologias, 'patologias');
    if (v !== undefined) data.patologias = v;
  }
  if (input.objetivos !== undefined) {
    const v = normalizeOptionalText(input.objetivos, 'objetivos');
    if (v !== undefined) data.objetivos = v;
  }
  if (input.diasEntrenamiento !== undefined) {
    const v = normalizeDiasEntrenamiento(input.diasEntrenamiento);
    if (v !== undefined) data.diasEntrenamiento = v;
  }

  if (Object.keys(data).length === 0) {
    throw new HttpError(400, 'No hay campos válidos para actualizar', 'VALIDATION_ERROR');
  }

  const existing = await prisma.socio.findUnique({ where: { id: socioId } });
  if (!existing || !existing.activo) {
    throw new HttpError(404, 'Socio no encontrado', 'SOCIO_NO_ENCONTRADO');
  }

  try {
    const socio = await prisma.socio.update({ where: { id: socioId }, data });
    return toSocioDTO(socio);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new HttpError(409, 'Ya existe otro socio con ese dni', 'DNI_DUPLICADO');
    }
    throw err;
  }
}

/**
 * Borrado físico de un socio (elimina la fila por completo).
 * - 404 si el socio no existe.
 * - 409 (SOCIO_CON_HISTORIAL) si está ACTIVO y tiene historial
 *   (pagos o membresías): primero corresponde la baja lógica, para no
 *   borrar de un clic registros contables de un socio en actividad.
 * - Si está INACTIVO (baja por vencimiento o por el dueño), se elimina
 *   todo en transacción: pagos, membresías, reservas, rutinas y usuario
 *   de acceso (estos últimos por cascada del schema). Es irreversible y
 *   altera el historial de cobranza: usar solo para socios dados de baja.
 */
export async function deleteSocioDefinitivo(id: string): Promise<{ id: string }> {
  const socioId = assertId(id);

  const existing = await prisma.socio.findUnique({ where: { id: socioId } });
  if (!existing) {
    throw new HttpError(404, 'Socio no encontrado', 'SOCIO_NO_ENCONTRADO');
  }

  const [pagos, membresias] = await Promise.all([
    prisma.pago.count({ where: { socioId } }),
    prisma.membresia.count({ where: { socioId } }),
  ]);
  if ((pagos > 0 || membresias > 0) && existing.activo) {
    throw new HttpError(
      409,
      'El socio está activo y tiene historial de pagos/membresías. Dele la baja lógica primero y luego elimínelo por completo.',
      'SOCIO_CON_HISTORIAL',
    );
  }

  await prisma.$transaction(async (tx) => {
    // Los pagos bloquean el borrado (Restrict hacia Socio y Membresia):
    // se eliminan primero; las membresías, reservas, rutinas y el usuario
    // de acceso caen por la cascada del schema al borrar el socio.
    await tx.pago.deleteMany({ where: { socioId } });
    await tx.socio.delete({ where: { id: socioId } });
  });
  return { id: socioId };
}

/**
 * Baja lógica de un socio (activo = false).
 * Libera sus reservas en turnos (devuelve el cupo) en la misma transacción:
 * un socio dado de baja no debe seguir ocupando lugar. Si luego se
 * reactiva con un pago, los horarios se reasignan manualmente.
 * - 404 si el socio no existe o ya está dado de baja.
 */
export async function deactivateSocio(id: string): Promise<ISocio> {
  const socioId = assertId(id);

  const existing = await prisma.socio.findUnique({ where: { id: socioId } });
  if (!existing || !existing.activo) {
    throw new HttpError(404, 'Socio no encontrado', 'SOCIO_NO_ENCONTRADO');
  }

  const socio = await prisma.$transaction(async (tx) => {
    await tx.reserva.deleteMany({ where: { socioId } });
    return tx.socio.update({
      where: { id: socioId },
      data: { activo: false },
    });
  });
  return toSocioDTO(socio);
}
