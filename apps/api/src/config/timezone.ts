import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';
import type { DiaSemana } from '@gym/shared';
import { parseDateOnly } from '../utils/dates.js';

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
