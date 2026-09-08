import { Prisma, type Rutina } from '@prisma/client';
import type { CreateRutinaDTO, IEjercicioRutina, IRutina } from '@gym/shared';
import { prisma } from '../config/prisma.js';
import { HttpError } from '../utils/http-error.js';

const TITULO_MAX = 120;
const EJERCICIOS_MAX = 100;
const EJERCICIO_MAX = 120;
const SERIES_MAX = 20;
const REPETICIONES_MAX = 20;
const NOTAS_MAX = 500;

function assertId(id: unknown): string {
  if (typeof id !== 'string' || !id.trim()) {
    throw new HttpError(400, 'El id es obligatorio', 'VALIDATION_ERROR');
  }
  return id.trim();
}

function assertTexto(value: unknown, field: string, max: number, obligatorio: boolean): string {
  if (value === undefined || value === null) {
    if (obligatorio) throw new HttpError(400, `El campo ${field} es obligatorio`, 'VALIDATION_ERROR');
    return '';
  }
  if (typeof value !== 'string') {
    throw new HttpError(400, `El campo ${field} debe ser un texto`, 'VALIDATION_ERROR');
  }
  const trimmed = value.trim();
  if (obligatorio && !trimmed) {
    throw new HttpError(400, `El campo ${field} es obligatorio`, 'VALIDATION_ERROR');
  }
  if (trimmed.length > max) {
    throw new HttpError(400, `El campo ${field} supera los ${max} caracteres`, 'VALIDATION_ERROR');
  }
  return trimmed;
}

// ---------------------------------------------------------------------------
// Validador puro (testeable sin Prisma ni Express — ver TESTER.md §3).
// El JSON de ejercicios es dato externo: se valida forma y contenido
// antes de persistir, nunca se guarda tal cual llega.
// ---------------------------------------------------------------------------

export function validarEjercicios(value: unknown): IEjercicioRutina[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new HttpError(400, 'La rutina debe tener al menos un ejercicio', 'VALIDATION_ERROR');
  }
  if (value.length > EJERCICIOS_MAX) {
    throw new HttpError(400, `La rutina supera los ${EJERCICIOS_MAX} ejercicios`, 'VALIDATION_ERROR');
  }
  return value.map((item: unknown, i: number): IEjercicioRutina => {
    if (item === null || typeof item !== 'object') {
      throw new HttpError(400, `El ejercicio #${i + 1} es inválido`, 'VALIDATION_ERROR');
    }
    const e = item as Record<string, unknown>;
    return {
      ejercicio: assertTexto(e.ejercicio, `ejercicios[${i}].ejercicio`, EJERCICIO_MAX, true),
      series: assertTexto(e.series, `ejercicios[${i}].series`, SERIES_MAX, false),
      repeticiones: assertTexto(e.repeticiones, `ejercicios[${i}].repeticiones`, REPETICIONES_MAX, false),
      notas: assertTexto(e.notas, `ejercicios[${i}].notas`, NOTAS_MAX, false),
    };
  });
}

function toRutinaDTO(r: Rutina & { socio: { id: string; nombre: string; dni: string } }): IRutina {
  return {
    id: r.id,
    socioId: r.socioId,
    titulo: r.titulo,
    fechaCreacion: r.fechaCreacion.toISOString(),
    ejercicios: r.ejercicios as unknown as IEjercicioRutina[],
    socio: r.socio,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

const SOCIO_SELECT = { id: true, nombre: true, dni: true } as const;

/**
 * Crea y asigna una rutina a un socio.
 * - 400 si título/ejercicios son inválidos.
 * - 404 si el socio no existe.
 */
export async function createRutina(input: CreateRutinaDTO): Promise<IRutina> {
  if (input === null || typeof input !== 'object') {
    throw new HttpError(400, 'El cuerpo de la petición es inválido', 'VALIDATION_ERROR');
  }
  const socioId = assertId(input.socioId);
  const titulo = assertTexto(input.titulo, 'titulo', TITULO_MAX, true);
  const ejercicios = validarEjercicios(input.ejercicios);

  const socio = await prisma.socio.findUnique({ where: { id: socioId }, select: SOCIO_SELECT });
  if (!socio) throw new HttpError(404, 'Socio no encontrado', 'SOCIO_NO_ENCONTRADO');

  const rutina = await prisma.rutina.create({
    data: {
      socioId,
      titulo,
      ejercicios: ejercicios as unknown as Prisma.InputJsonValue,
    },
    include: { socio: { select: SOCIO_SELECT } },
  });
  return toRutinaDTO(rutina);
}

/**
 * Lista las rutinas de un socio (más recientes primero).
 * - 404 si el socio no existe.
 */
export async function listRutinasPorSocio(socioId: string): Promise<IRutina[]> {
  const id = assertId(socioId);
  const socio = await prisma.socio.findUnique({ where: { id }, select: SOCIO_SELECT });
  if (!socio) throw new HttpError(404, 'Socio no encontrado', 'SOCIO_NO_ENCONTRADO');

  const rutinas = await prisma.rutina.findMany({
    where: { socioId: id },
    include: { socio: { select: SOCIO_SELECT } },
    orderBy: { fechaCreacion: 'desc' },
  });
  return rutinas.map(toRutinaDTO);
}
