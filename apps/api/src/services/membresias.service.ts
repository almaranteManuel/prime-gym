import { Prisma, type Membresia } from '@prisma/client';
import type { IMembresia } from '@gym/shared';
import { prisma } from '../config/prisma.js';
import { toDateOnlyString } from '../utils/dates.js';
import { HttpError } from '../utils/http-error.js';

export function toMembresiaDTO(m: Membresia): IMembresia {
  return {
    id: m.id,
    socioId: m.socioId,
    fechaInicio: toDateOnlyString(m.fechaInicio),
    fechaFin: toDateOnlyString(m.fechaFin),
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  };
}

type PrismaExecutor = Prisma.TransactionClient | typeof prisma;

/**
 * Última membresía del socio (la de mayor fechaFin) o null si no tiene
 * historial. Acepta el cliente transaccional para reusarse dentro de
 * `prisma.$transaction`.
 */
export async function findUltimaMembresia(
  client: PrismaExecutor,
  socioId: string,
): Promise<Membresia | null> {
  return client.membresia.findFirst({
    where: { socioId },
    orderBy: { fechaFin: 'desc' },
  });
}

/** Tope de registros devueltos por el historial (evita payloads pesados). */
export const HISTORIAL_MEMBRESIAS_MAX = 200 as const;

/**
 * Historial de membresías de un socio (vigencia más reciente primero).
 * - 400 si el id es vacío.
 * - 404 si el socio no existe.
 */
export async function listMembresiasPorSocio(socioId: string): Promise<IMembresia[]> {
  const id = socioId?.trim();
  if (!id) throw new HttpError(400, 'El id del socio es obligatorio', 'VALIDATION_ERROR');

  const socio = await prisma.socio.findUnique({ where: { id } });
  if (!socio) throw new HttpError(404, 'Socio no encontrado', 'SOCIO_NO_ENCONTRADO');

  const membresias = await prisma.membresia.findMany({
    where: { socioId: id },
    orderBy: { fechaFin: 'desc' },
    take: HISTORIAL_MEMBRESIAS_MAX,
  });
  return membresias.map(toMembresiaDTO);
}
