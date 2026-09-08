import { Prisma, type Socio } from '@prisma/client';
import type { CreateSocioDTO, ISocio, UpdateSocioDTO } from '@gym/shared';
import { prisma } from '../config/prisma.js';
import { HttpError } from '../utils/http-error.js';
import { toDateOnlyString } from '../utils/dates.js';

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
 * Da de alta un socio nuevo (siempre activo; fechaAlta la asigna la BD).
 * - 400 si faltan nombre/celular/dni o exceden longitudes.
 * - 409 si el dni ya existe (P2002 de Prisma).
 */
export async function createSocio(input: CreateSocioDTO): Promise<ISocio> {
  if (input === null || typeof input !== 'object') {
    throw new HttpError(400, 'El cuerpo de la petición es inválido', 'VALIDATION_ERROR');
  }
  const nombre = assertNonEmptyString(input.nombre, 'nombre', NOMBRE_MAX);
  const celular = assertNonEmptyString(input.celular, 'celular', CELULAR_MAX);
  const dni = assertNonEmptyString(input.dni, 'dni', DNI_MAX);
  const patologias = normalizeOptionalText(input.patologias, 'patologias') ?? null;
  const objetivos = normalizeOptionalText(input.objetivos, 'objetivos') ?? null;

  try {
    const socio = await prisma.socio.create({
      data: { nombre, celular, dni, patologias, objetivos },
    });
    return toSocioDTO(socio);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new HttpError(409, `Ya existe un socio con dni ${dni}`, 'DNI_DUPLICADO');
    }
    throw err;
  }
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

  const data: { nombre?: string; celular?: string; dni?: string; patologias?: string | null; objetivos?: string | null } = {};

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
 * Baja lógica de un socio (activo = false).
 * - 404 si el socio no existe o ya está dado de baja.
 */
export async function deactivateSocio(id: string): Promise<ISocio> {
  const socioId = assertId(id);

  const existing = await prisma.socio.findUnique({ where: { id: socioId } });
  if (!existing || !existing.activo) {
    throw new HttpError(404, 'Socio no encontrado', 'SOCIO_NO_ENCONTRADO');
  }

  const socio = await prisma.socio.update({
    where: { id: socioId },
    data: { activo: false },
  });
  return toSocioDTO(socio);
}
