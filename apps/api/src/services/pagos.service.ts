import { Prisma, type Membresia, type Pago } from '@prisma/client';
import type { CreatePagoDTO, IMembresia, IPago, RegistrarPagoResult } from '@gym/shared';
import { METODOS_PAGO } from '@gym/shared';
import { prisma } from '../config/prisma.js';
import { addMonthsUTC, parseDateOnly, toDateOnlyString, toDateOnlyUTC } from '../utils/dates.js';
import { HttpError } from '../utils/http-error.js';
import { findUltimaMembresia, toMembresiaDTO } from './membresias.service.js';
import { normalizeDiasEntrenamiento } from './socios.service.js';

/** Meses de vigencia que otorga cada pago total. */
const MEMBRESIA_DURACION_MESES = 1 as const;

function toPagoDTO(p: Pago): IPago {
  return {
    id: p.id,
    socioId: p.socioId,
    membresiaId: p.membresiaId,
    monto: p.monto.toNumber(),
    metodo: p.metodo,
    fechaPago: toDateOnlyString(p.fechaPago),
    createdAt: p.createdAt.toISOString(),
  };
}

/** Serializa una membresía sin exponer el modelo de Prisma. */
export function toMembresiaResponse(m: Membresia): IMembresia {
  return toMembresiaDTO(m);
}

/** Tope de registros devueltos por el historial (evita payloads pesados). */
export const HISTORIAL_PAGOS_MAX = 200 as const;

/**
 * Historial de pagos de un socio (más recientes primero).
 * - 400 si el id es vacío.
 * - 404 si el socio no existe.
 */
export async function listPagosPorSocio(socioId: string): Promise<IPago[]> {
  const id = socioId?.trim();
  if (!id) throw new HttpError(400, 'El id del socio es obligatorio', 'VALIDATION_ERROR');

  const socio = await prisma.socio.findUnique({ where: { id } });
  if (!socio) throw new HttpError(404, 'Socio no encontrado', 'SOCIO_NO_ENCONTRADO');

  const pagos = await prisma.pago.findMany({
    where: { socioId: id },
    orderBy: [{ fechaPago: 'desc' }, { createdAt: 'desc' }],
    take: HISTORIAL_PAGOS_MAX,
  });
  return pagos.map(toPagoDTO);
}

/**
 * Registra un pago por el monto TOTAL y actualiza la membresía, todo en
 * una transacción:
 * - Si el socio tiene una membresía vigente a la fecha de referencia
 *   (fechaFin >= fechaPago, hoy por defecto), se extiende su fechaFin
 *   +1 mes calendario.
 * - Si no (sin historial o vencida), se crea una nueva de
 *   [fechaPago, fechaPago + 1 mes].
 * - El pago queda vinculado a esa membresía (pago.membresiaId).
 * - Si el socio estaba inactivo, se reactiva (activo = true).
 *
 * Errores: 400 validación, 404 socio inexistente.
 */
export async function registrarPago(input: CreatePagoDTO): Promise<RegistrarPagoResult> {
  const socioId = input.socioId?.trim();
  if (!socioId) throw new HttpError(400, 'socioId es obligatorio', 'VALIDATION_ERROR');

  if (typeof input.monto !== 'number' || !Number.isFinite(input.monto) || input.monto <= 0) {
    throw new HttpError(400, 'El monto debe ser un número mayor a 0 (pago total, sin parciales)', 'VALIDATION_ERROR');
  }
  const monto = Math.round(input.monto * 100) / 100;

  if (!METODOS_PAGO.includes(input.metodo)) {
    throw new HttpError(
      400,
      `Método inválido. Valores permitidos: ${METODOS_PAGO.join(', ')}`,
      'VALIDATION_ERROR',
    );
  }

  let fechaPago: Date;
  if (input.fechaPago !== undefined) {
    const parsed = parseDateOnly(input.fechaPago);
    if (!parsed) throw new HttpError(400, 'fechaPago debe tener formato YYYY-MM-DD válido', 'VALIDATION_ERROR');
    fechaPago = parsed;
  } else {
    fechaPago = toDateOnlyUTC(new Date());
  }

  // Días por semana que planea asistir (opcional): actualiza el dato del socio.
  const diasEntrenamiento = normalizeDiasEntrenamiento(input.diasEntrenamiento);

  return prisma.$transaction(async (tx) => {
    const socio = await tx.socio.findUnique({ where: { id: socioId } });
    if (!socio) throw new HttpError(404, 'Socio no encontrado', 'SOCIO_NO_ENCONTRADO');

    const ultima = await findUltimaMembresia(tx, socioId);

    let membresia: Membresia;
    let membresiaExtendida: boolean;

    if (ultima && toDateOnlyUTC(ultima.fechaFin) >= fechaPago) {
      // Vigente a fecha de pago → extender 1 mes calendario.
      membresia = await tx.membresia.update({
        where: { id: ultima.id },
        data: { fechaFin: addMonthsUTC(ultima.fechaFin, MEMBRESIA_DURACION_MESES) },
      });
      membresiaExtendida = true;
    } else {
      // Sin historial o vencida → período nuevo desde la fecha de pago.
      membresia = await tx.membresia.create({
        data: {
          socioId,
          fechaInicio: fechaPago,
          fechaFin: addMonthsUTC(fechaPago, MEMBRESIA_DURACION_MESES),
        },
      });
      membresiaExtendida = false;
    }

    const pago = await tx.pago.create({
      data: {
        socioId,
        membresiaId: membresia.id,
        monto: new Prisma.Decimal(monto),
        metodo: input.metodo,
        fechaPago,
      },
    });

    let socioReactivado = false;
    if (!socio.activo) {
      await tx.socio.update({ where: { id: socioId }, data: { activo: true } });
      socioReactivado = true;
    }
    if (diasEntrenamiento !== undefined) {
      await tx.socio.update({ where: { id: socioId }, data: { diasEntrenamiento } });
    }

    return { pago: toPagoDTO(pago), membresia: toMembresiaDTO(membresia), membresiaExtendida, socioReactivado };
  });
}
