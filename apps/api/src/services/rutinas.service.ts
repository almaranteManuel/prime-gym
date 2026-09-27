import { Prisma, type Rutina } from '@prisma/client';
import type { CreateRutinaDTO, IBloqueRutina, IDiaRutina, IEjercicioRutina, IRutina } from '@gym/shared';
import { prisma } from '../config/prisma.js';
import { HttpError } from '../utils/http-error.js';

const TITULO_MAX = 120;
const DIA_NOMBRE_MAX = 40;
const ETAPA_MAX = 120;
const OBJETIVO_MAX = 200;
const BLOQUE_NOMBRE_MAX = 120;
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
// Validadores puros (testeables sin Prisma ni Express — ver TESTER.md §3).
// El JSON de días es dato externo: se valida forma y contenido
// antes de persistir, nunca se guarda tal cual llega.
// Sin topes de cantidad (los maneja el dueño): solo se exige la
// estructura mínima (día → ≥1 bloque → ≥1 ejercicio con nombre).
// ---------------------------------------------------------------------------

function validarEjercicio(item: unknown, ruta: string): IEjercicioRutina {
  if (item === null || typeof item !== 'object') {
    throw new HttpError(400, `El ejercicio ${ruta} es inválido`, 'VALIDATION_ERROR');
  }
  const e = item as Record<string, unknown>;
  return {
    ejercicio: assertTexto(e.ejercicio, `${ruta}.ejercicio`, EJERCICIO_MAX, true),
    series: assertTexto(e.series, `${ruta}.series`, SERIES_MAX, false),
    repeticiones: assertTexto(e.repeticiones, `${ruta}.repeticiones`, REPETICIONES_MAX, false),
    notas: assertTexto(e.notas, `${ruta}.notas`, NOTAS_MAX, false),
  };
}

function validarBloque(item: unknown, ruta: string): IBloqueRutina {
  if (item === null || typeof item !== 'object') {
    throw new HttpError(400, `El bloque ${ruta} es inválido`, 'VALIDATION_ERROR');
  }
  const b = item as Record<string, unknown>;
  const nombre = assertTexto(b.nombre, `${ruta}.nombre`, BLOQUE_NOMBRE_MAX, true);
  if (!Array.isArray(b.ejercicios) || b.ejercicios.length === 0) {
    throw new HttpError(400, `El bloque ${ruta} debe tener al menos un ejercicio`, 'VALIDATION_ERROR');
  }
  return {
    nombre,
    ejercicios: b.ejercicios.map((e: unknown, i: number) => validarEjercicio(e, `${ruta}.ejercicios[${i}]`)),
  };
}

export function validarDias(value: unknown): IDiaRutina[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new HttpError(400, 'La rutina debe tener al menos un día', 'VALIDATION_ERROR');
  }
  return value.map((item: unknown, i: number): IDiaRutina => {
    const ruta = `dias[${i}]`;
    if (item === null || typeof item !== 'object') {
      throw new HttpError(400, `El día ${ruta} es inválido`, 'VALIDATION_ERROR');
    }
    const d = item as Record<string, unknown>;
    if (!Array.isArray(d.bloques) || d.bloques.length === 0) {
      throw new HttpError(400, `El día ${ruta} debe tener al menos un bloque`, 'VALIDATION_ERROR');
    }
    return {
      nombre: assertTexto(d.nombre, `${ruta}.nombre`, DIA_NOMBRE_MAX, true),
      etapa: assertTexto(d.etapa, `${ruta}.etapa`, ETAPA_MAX, false),
      objetivo: assertTexto(d.objetivo, `${ruta}.objetivo`, OBJETIVO_MAX, false),
      bloques: d.bloques.map((b: unknown, j: number) => validarBloque(b, `${ruta}.bloques[${j}]`)),
    };
  });
}

function toRutinaDTO(r: Rutina & { socio: { id: string; nombre: string; dni: string } }): IRutina {
  return {
    id: r.id,
    socioId: r.socioId,
    titulo: r.titulo,
    fechaCreacion: r.fechaCreacion.toISOString(),
    dias: r.dias as unknown as IDiaRutina[],
    socio: r.socio,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

const SOCIO_SELECT = { id: true, nombre: true, dni: true } as const;

/**
 * Crea y asigna una rutina a un socio.
 * - 400 si título/días son inválidos.
 * - 404 si el socio no existe.
 */
export async function createRutina(input: CreateRutinaDTO): Promise<IRutina> {
  if (input === null || typeof input !== 'object') {
    throw new HttpError(400, 'El cuerpo de la petición es inválido', 'VALIDATION_ERROR');
  }
  const socioId = assertId(input.socioId);
  const titulo = assertTexto(input.titulo, 'titulo', TITULO_MAX, true);
  const dias = validarDias(input.dias);

  const socio = await prisma.socio.findUnique({ where: { id: socioId }, select: SOCIO_SELECT });
  if (!socio) throw new HttpError(404, 'Socio no encontrado', 'SOCIO_NO_ENCONTRADO');

  const rutina = await prisma.rutina.create({
    data: {
      socioId,
      titulo,
      dias: dias as unknown as Prisma.InputJsonValue,
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

/**
 * Elimina una rutina por id.
 * - 404 si no existe.
 */
export async function deleteRutina(id: string): Promise<void> {
  const rutinaId = assertId(id);
  const existing = await prisma.rutina.findUnique({ where: { id: rutinaId } });
  if (!existing) throw new HttpError(404, 'Rutina no encontrada', 'RUTINA_NO_ENCONTRADA');
  await prisma.rutina.delete({ where: { id: rutinaId } });
}
