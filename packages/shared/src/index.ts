/**
 * @gym/shared — punto único de tipos compartidos.
 *
 * Se importa igual en backend y frontend:
 *   import type { ISocio, CreateSocioDTO } from '@gym/shared';
 *
 * Convenciones:
 * - Fechas "solo día" (fechaAlta, fechaInicio, fechaFin, fechaPago)
 *   viajan como string "YYYY-MM-DD" (igual que @db.Date de Prisma).
 * - Timestamps (createdAt, updatedAt, timestamp) viajan como ISO string.
 */

// ---------------------------------------------------------------------------
// Salud de la API (contrato compartido)
// ---------------------------------------------------------------------------

export interface ApiHealthResponse {
  status: 'ok';
  service: string;
  timestamp: string;
  uptimeSeconds: number;
}

// ---------------------------------------------------------------------------
// Envoltorio genérico de respuestas API
// ---------------------------------------------------------------------------

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

export type ID = string;

export const API_PREFIX = '/api' as const;

export const ROLES_USUARIO = ['admin', 'alumno'] as const;
export type RolUsuario = (typeof ROLES_USUARIO)[number];

export interface AuthUser {
  id: string;
  username: string;
  rol: RolUsuario;
}

export interface AuthTokenPayload {
  sub: string;
  username: string;
  rol: RolUsuario;
  iat: number;
  exp: number;
}

export interface LoginDTO {
  username: string;
  password: string;
}

export interface RegisterDTO {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

// ---------------------------------------------------------------------------
// Dominio gimnasio — enums (espejan los enums de Prisma)
// ---------------------------------------------------------------------------

export const METODOS_PAGO = ['EFECTIVO', 'TRANSFERENCIA'] as const;
export type MetodoPago = (typeof METODOS_PAGO)[number];

export const DIAS_SEMANA = [
  'LUNES',
  'MARTES',
  'MIERCOLES',
  'JUEVES',
  'VIERNES',
  'SABADO',
  'DOMINGO',
] as const;
export type DiaSemana = (typeof DIAS_SEMANA)[number];

// ---------------------------------------------------------------------------
// Dominio gimnasio — reglas de negocio compartidas
// ---------------------------------------------------------------------------

/** Días que agrega (o extiende) cada pago a la membresía. */
export const MEMBRESIA_DURACION_DIAS = 30 as const;

/** Cupo permitido por turno (gestión manual de mostrador). */
export const TURNO_CUPO_MIN = 4 as const;
export const TURNO_CUPO_MAX = 5 as const;

/** Duración de cada turno, en minutos. */
export const TURNO_DURACION_MINUTOS = 60 as const;

// ---------------------------------------------------------------------------
// Dominio gimnasio — entidades (lectura)
// ---------------------------------------------------------------------------

export interface ISocio {
  id: string;
  nombre: string;
  celular: string;
  dni: string;
  patologias: string | null;
  objetivos: string | null;
  activo: boolean;
  /** Días por semana que planea asistir (null = sin dato). Se pregunta al pagar. */
  diasEntrenamiento: number | null;
  /** "YYYY-MM-DD" */
  fechaAlta: string;
  createdAt: string;
  updatedAt: string;
}

export interface IMembresia {
  id: string;
  socioId: string;
  /** "YYYY-MM-DD" */
  fechaInicio: string;
  /** "YYYY-MM-DD" */
  fechaFin: string;
  createdAt: string;
  updatedAt: string;
}

export interface IPago {
  id: string;
  socioId: string;
  membresiaId: string;
  monto: number;
  metodo: MetodoPago;
  /** "YYYY-MM-DD" */
  fechaPago: string;
  createdAt: string;
}

export interface ITurno {
  id: string;
  dia: DiaSemana;
  /** "HH:mm" (24 h), dura TURNO_DURACION_MINUTOS */
  horaInicio: string;
  cupoMax: number;
  createdAt: string;
  updatedAt: string;
}

export interface IReserva {
  id: string;
  socioId: string;
  turnoId: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Dominio gimnasio — DTOs de escritura
// ---------------------------------------------------------------------------

export interface CreateSocioDTO {
  nombre: string;
  celular: string;
  /** Único. Se normaliza (trim) en el backend. */
  dni: string;
  patologias?: string | null;
  objetivos?: string | null;
  /** Días por semana que planea asistir. Se carga al pagar o en edición. */
  diasEntrenamiento?: number | null;
}

/**
 * Actualización parcial de un socio.
 * Omite campos administrados por la BD (id, fechaAlta, activo,
 * createdAt, updatedAt): no son editables por el cliente.
 */
export type UpdateSocioDTO = Partial<CreateSocioDTO>;

export interface CreatePagoDTO {
  socioId: string;
  /** Monto TOTAL (no hay parciales). Debe ser > 0. */
  monto: number;
  metodo: MetodoPago;
  /** "YYYY-MM-DD". @default hoy */
  fechaPago?: string;
  /** Días por semana que planea asistir. Actualiza el dato del socio. */
  diasEntrenamiento?: number | null;
}

/** Respuesta de POST /api/pagos. */
export interface RegistrarPagoResult {
  pago: IPago;
  membresia: IMembresia;
  /** true si se extendió una membresía vigente, false si se creó una nueva. */
  membresiaExtendida: boolean;
  /** true si el socio estaba inactivo y el pago lo reactivó (activo = true). */
  socioReactivado: boolean;
}

// ---------------------------------------------------------------------------
// Dominio gimnasio — DTOs de turnos y asignación
// ---------------------------------------------------------------------------

export interface CreateTurnoDTO {
  dia: DiaSemana;
  /** "HH:mm" (24 h). */
  horaInicio: string;
  /** @default 5. Rango permitido: TURNO_CUPO_MIN..TURNO_CUPO_MAX. */
  cupoMax?: number;
}

/** Actualización parcial de un turno (dia/horaInicio/cupoMax). */
export type UpdateTurnoDTO = Partial<CreateTurnoDTO>;

export interface AsignarTurnoDTO {
  socioId: string;
}

/** Reserva con los datos mínimos del socio para mostrar en la UI. */
export interface IReservaConSocio extends IReserva {
  socio: Pick<ISocio, 'id' | 'nombre' | 'dni'>;
}

/** Turno con su ocupación (un alumno anotado asiste todas las semanas). */
export interface ITurnoConOcupacion extends ITurno {
  ocupados: number;
  reservas: IReservaConSocio[];
}

/** Respuesta de POST /api/turnos/:id/asignar. */
export interface AsignarTurnoResult {
  reserva: IReserva;
  ocupados: number;
  cupoMax: number;
}

// ---------------------------------------------------------------------------
// Dominio gimnasio — Dashboard del día
// ---------------------------------------------------------------------------

/** Datos básicos del socio para el panel del día (incluye salud). */
export interface IDashboardSocio {
  id: string;
  nombre: string;
  dni: string;
  patologias: string | null;
}

export interface IDashboardReserva extends IReserva {
  socio: IDashboardSocio;
}

export interface IDashboardTurno extends ITurno {
  ocupados: number;
  reservas: IDashboardReserva[];
}

/** Respuesta de GET /api/dashboard/hoy. */
export interface IDashboardHoy {
  /** "YYYY-MM-DD" en America/Argentina/Buenos_Aires. */
  fecha: string;
  dia: DiaSemana;
  /** Turnos del día ordenados por horaInicio. */
  turnos: IDashboardTurno[];
}

// ---------------------------------------------------------------------------
// Dominio gimnasio — Rutinas personalizadas (estructura DÍA → BLOQUE → ejercicios)
// ---------------------------------------------------------------------------

/** Un ejercicio de texto libre pero estructurado dentro de un bloque. */
export interface IEjercicioRutina {
  ejercicio: string;
  series: string;
  repeticiones: string;
  notas: string;
}

/** Bloque dentro de un día (nombre libre, ej. "Movilidad", "Fuerza", "Tren superior"). */
export interface IBloqueRutina {
  nombre: string;
  ejercicios: IEjercicioRutina[];
}

/** Un día de entrenamiento (genérico: DÍA 1, DÍA 2, ...). */
export interface IDiaRutina {
  /** Ej. 'DÍA 1'. */
  nombre: string;
  etapa: string;
  objetivo: string;
  bloques: IBloqueRutina[];
}

/** Rutina con los datos del socio para mostrar y exportar. */
export interface IRutina {
  id: string;
  socioId: string;
  titulo: string;
  /** ISO string. */
  fechaCreacion: string;
  dias: IDiaRutina[];
  socio: Pick<ISocio, 'id' | 'nombre' | 'dni'>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRutinaDTO {
  socioId: string;
  /** Ej. 'Hipertrofia - 4 días'. */
  titulo: string;
  dias: IDiaRutina[];
}
