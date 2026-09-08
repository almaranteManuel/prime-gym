import { Prisma, type Membresia } from '@prisma/client';
import type { IMembresia } from '@gym/shared';
import { prisma } from '../config/prisma.js';
import { toDateOnlyString } from '../utils/dates.js';

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
