import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';
import type { DiaSemana } from '@gym/shared';
import { addMonthsUTC, parseDateOnly } from '../utils/dates.js';

dayjs.extend(utc);
dayjs.extend(timezone);

/** Zona horaria operativa del gimnasio (mostrador). */
export const GYM_TZ = 'America/Argentina/Buenos_Aires' as const;

/** dayjs: 0 = domingo … 6 = sábado. */
const DIAS_POR_INDICE: readonly DiaSemana[] = [
  'DOMINGO',
  'LUNES',
  'MARTES',
  'MIERCOLES',
  'JUEVES',
  'VIERNES',
  'SABADO',
] as const;

export interface HoyBA {
  /** Día de la semana vigente en el gimnasio. */
  dia: DiaSemana;
  /** Fecha calendario (medianoche UTC) para comparar con @db.Date. */
  fecha: Date;
  /** "YYYY-MM-DD" en la zona del gimnasio. */
  fechaStr: string;
}

/**
 * Determina el día de la semana y la fecha "de hoy" en la zona del
 * gimnasio. `fecha` es medianoche UTC del día calendario BA, lista para
 * comparar por igualdad con columnas @db.Date (misma convención que
 * el resto de los servicios). Acepta `now` para tests deterministas
 * (TESTER.md §13).
 */
export function hoyEnBuenosAires(now: Date = new Date()): HoyBA {
  const h = dayjs(now).tz(GYM_TZ);
  const fechaStr = h.format('YYYY-MM-DD');
  const parsed = parseDateOnly(fechaStr);
  if (!parsed) throw new Error(`No se pudo determinar la fecha actual (${fechaStr})`);
  const dia = DIAS_POR_INDICE[h.day()];
  if (!dia) throw new Error(`Día de la semana fuera de rango (${h.day()})`);
  return { dia, fecha: parsed, fechaStr };
}

/** Mes vigente "YYYY-MM" en la zona del gimnasio. */
export function mesActualEnBuenosAires(now: Date = new Date()): string {
  return dayjs(now).tz(GYM_TZ).format('YYYY-MM');
}

export interface RangoMes {
  mes: string;
  /** Inicio del mes (medianoche UTC), listo para Prisma @db.Date. */
  inicio: Date;
  /** Inicio del mes siguiente (límite exclusivo). */
  fin: Date;
}

/**
 * Valida "YYYY-MM" y devuelve el rango [inicio, fin) en UTC para
 * comparar con columnas @db.Date (misma convención que el resto).
 * Retorna null si el mes no es válido.
 */
export function rangoMesEnBuenosAires(mes: string): RangoMes | null {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) return null;
  const inicio = parseDateOnly(`${mes}-01`);
  if (!inicio) return null;
  return { mes, inicio, fin: addMonthsUTC(inicio, 1) };
}
