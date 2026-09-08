import { useState } from 'react';
import type { IDashboardReserva } from '@gym/shared';
import { useDashboard } from '../hooks/useDashboard.js';

/** Fecha "YYYY-MM-DD" → texto legible en la zona del gimnasio. */
function formatoFechaLarga(fecha: string): string {
  const texto = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(`${fecha}T12:00:00.000Z`));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

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

/**
 * Panel del día (vista inicial): turnos de hoy con ocupación y alumnos.
 * Lleno (5/5) → borde rojo; con lugar → tono neutro.
 */
export function Dashboard() {
  const { dashboard, loading, error, refresh, unassign } = useDashboard();
  const [armingId, setArmingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleConfirm(reservaId: string): Promise<void> {
    setBusyId(reservaId);
    try {
      const ok = await unassign(reservaId);
      if (ok) setArmingId(null);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Panel del día</h1>
            <p className="mt-1 text-sm text-zinc-400">
              {dashboard ? formatoFechaLarga(dashboard.fecha) : 'Hoy'} · America/Argentina/Buenos_Aires
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading ? 'Cargando…' : 'Recargar'}
          </button>
        </header>

        {error ? (
          <p role="alert" className="mt-4 rounded-xl border border-red-900/60 bg-red-950/50 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        <div className="mt-6">
          {loading && !dashboard ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
              <p className="text-sm text-zinc-400">Cargando el día…</p>
            </div>
          ) : !dashboard || dashboard.turnos.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
              <p className="text-sm text-zinc-400">
                No hay turnos para hoy{dashboard ? ` (${dashboard.dia})` : ''}. Crealos en la sección Horarios.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {dashboard.turnos.map((turno) => {
                const lleno = turno.ocupados >= turno.cupoMax;
                return (
                  <article
                    key={turno.id}
                    className={`flex flex-col rounded-xl border bg-zinc-900 p-5 ${
                      lleno ? 'border-red-900 bg-red-950/20' : 'border-zinc-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-mono text-lg font-bold text-zinc-100">{turno.horaInicio}</h3>
                        <p className="text-xs text-zinc-500">1 hora</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${
                          lleno
                            ? 'border-red-900/60 bg-red-950/60 text-red-200'
                            : 'border-emerald-900/60 bg-emerald-950/60 text-emerald-200'
                        }`}
                      >
                        {turno.ocupados}/{turno.cupoMax} ocupados
                      </span>
                    </div>

                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-800" role="progressbar" aria-valuenow={turno.ocupados} aria-valuemin={0} aria-valuemax={turno.cupoMax}>
                      <div
                        className={`h-full rounded-full transition-all ${lleno ? 'bg-red-400' : 'bg-emerald-400'}`}
                        style={{ width: `${turno.cupoMax > 0 ? Math.min(100, (turno.ocupados / turno.cupoMax) * 100) : 0}%` }}
                      />
                    </div>

                    <ul className="mt-4 flex flex-col gap-2">
                      {turno.reservas.length === 0 ? (
                        <li className="text-xs text-zinc-500">Sin alumnos asignados.</li>
                      ) : (
                        turno.reservas.map((r) => (
                          <AlumnoRow
                            key={r.id}
                            reserva={r}
                            armed={armingId === r.id}
                            busy={busyId === r.id}
                            onArm={(id) => setArmingId(id)}
                            onDisarm={() => setArmingId(null)}
                            onConfirm={(id) => void handleConfirm(id)}
                          />
                        ))
                      )}
                    </ul>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
