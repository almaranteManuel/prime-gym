/**
 * Utilidades de fecha "solo día" en UTC.
 * Prisma @db.Date guarda el día calendario; operar en UTC evita
 * desplazamientos por zona horaria del servidor.
 */

/** Normaliza un Date a medianoche UTC (solo conserva el día). */
export function toDateOnlyUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** Suma días calendario en UTC. */
export function addDaysUTC(date: Date, days: number): Date {
  const d = toDateOnlyUTC(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/**
 * Suma meses calendario en UTC, fijando al último día del mes destino
 * si el día original no existe allí (ej. 31-01 + 1 mes → 28-02).
 */
export function addMonthsUTC(date: Date, months: number): Date {
  const d = toDateOnlyUTC(date);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return d;
}

/** Serializa un Date como "YYYY-MM-DD". */
export function toDateOnlyString(date: Date): string {
  return toDateOnlyUTC(date).toISOString().slice(0, 10);
}

/** Valida "YYYY-MM-DD" real (p. ej. rechaza 2024-02-30). */
export function parseDateOnly(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  return toDateOnlyString(d) === value ? d : null;
}
