import { useState } from 'react';
import { TURNO_DURACION_MINUTOS } from '@gym/shared';
import type { IDashboardReserva, IDashboardTurno } from '@gym/shared';

interface AlumnoRowProps {
  reserva: IDashboardReserva;
  armed: boolean;
  busy: boolean;
  onArm: (reservaId: string) => void;
  onDisarm: () => void;
  onConfirm: (reservaId: string) => void;
}

/** Fila de alumno con desasignación rápida en dos pasos (evita toques accidentales). */
function AlumnoRow({ reserva, armed, busy, onArm, onDisarm, onConfirm }: AlumnoRowProps) {
  const { socio } = reserva;
  return (
    <li className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-zinc-100">{socio.nombre}</p>
          <p className="font-mono text-[11px] text-zinc-500">{socio.dni}</p>
        </div>
        {armed ? (
          <div className="flex shrink-0 gap-1.5">
            <button
              type="button"
              disabled={busy}
              onClick={onDisarm}
              className="rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-[11px] text-zinc-300 hover:bg-zinc-700 disabled:opacity-50"
            >
              No
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onConfirm(reserva.id)}
              className="rounded-md border border-red-800 bg-red-950 px-2 py-1 text-[11px] font-semibold text-red-100 hover:bg-red-900 disabled:opacity-50"
            >
              {busy ? '…' : 'Sí, quitar'}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onArm(reserva.id)}
            title="Desasignar (aviso de último momento)"
            className="shrink-0 rounded-md px-2 py-1 text-[11px] text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-red-300"
          >
            Quitar
          </button>
        )}
      </div>
      {socio.patologias ? (
        <p className="mt-1.5 rounded-md border border-amber-900/60 bg-amber-950/40 px-2 py-1 text-[11px] text-amber-200" title={socio.patologias}>
          <span className="font-semibold">Salud:</span> {socio.patologias}
        </p>
      ) : null}
    </li>
  );
}

function horaFin(horaInicio: string): string {
  const [horas, minutos] = horaInicio.split(':').map(Number);
  const totalMinutos = ((horas ?? 0) * 60 + (minutos ?? 0) + TURNO_DURACION_MINUTOS) % (24 * 60);
  return `${String(Math.floor(totalMinutos / 60)).padStart(2, '0')}:${String(totalMinutos % 60).padStart(2, '0')}`;
}

interface DashboardTurnoCardProps {
  turno: IDashboardTurno;
  armingId: string | null;
  busyId: string | null;
  onArm: (reservaId: string) => void;
  onDisarm: () => void;
  onConfirm: (reservaId: string) => void;
}

/**
 * Turno del día en lista vertical: solo la cabecera visible (horario +
 * ocupación); click para expandir alumnos y desasignación.
 * Lleno → acento rojo; con lugar → acento esmeralda.
 */
export function DashboardTurnoCard({ turno, armingId, busyId, onArm, onDisarm, onConfirm }: DashboardTurnoCardProps) {
  const [expanded, setExpanded] = useState(false);

  const lleno = turno.ocupados >= turno.cupoMax;
  const ratio = turno.cupoMax > 0 ? turno.ocupados / turno.cupoMax : 0;
  const horario = `${turno.horaInicio} a ${horaFin(turno.horaInicio)}`;
  const accentClass = lleno ? 'border-l-red-500' : ratio > 0 ? 'border-l-emerald-500' : 'border-l-zinc-700';
  const badgeClass = lleno
    ? 'border-red-900/60 bg-red-950/60 text-red-200'
    : 'border-emerald-900/60 bg-emerald-950/60 text-emerald-200';

  return (
    <article className={`rounded-xl border border-zinc-800 border-l-4 bg-zinc-900 p-4 ${accentClass}`}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-label={`${expanded ? 'Contraer' : 'Expandir'} turno ${horario}`}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="flex min-w-0 items-center gap-2">
          <svg
            aria-hidden="true"
            className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform ${expanded ? 'rotate-90' : ''}`}
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="whitespace-nowrap font-mono text-base font-bold text-zinc-100">{horario}</span>
          <span className="hidden text-xs text-zinc-500 sm:inline">· 1 hora</span>
        </span>
        <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${badgeClass}`}>
          {turno.ocupados}/{turno.cupoMax} ocupados
        </span>
      </button>

      {expanded ? (
        <>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-800" role="progressbar" aria-valuenow={turno.ocupados} aria-valuemin={0} aria-valuemax={turno.cupoMax}>
            <div
              className={`h-full rounded-full transition-all ${lleno ? 'bg-red-400' : 'bg-emerald-400'}`}
              style={{ width: `${Math.min(100, ratio * 100)}%` }}
            />
          </div>
          <ul className="mt-3 flex flex-col gap-2">
            {turno.reservas.length === 0 ? (
              <li className="text-xs text-zinc-500">Sin alumnos asignados.</li>
            ) : (
              turno.reservas.map((r) => (
                <AlumnoRow
                  key={r.id}
                  reserva={r}
                  armed={armingId === r.id}
                  busy={busyId === r.id}
                  onArm={onArm}
                  onDisarm={onDisarm}
                  onConfirm={onConfirm}
                />
              ))
            )}
          </ul>
        </>
      ) : null}
    </article>
  );
}
