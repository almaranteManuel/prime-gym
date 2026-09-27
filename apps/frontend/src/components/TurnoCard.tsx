import { useState } from 'react';
import { TURNO_DURACION_MINUTOS } from '@gym/shared';
import type { ISocio, ITurnoConOcupacion } from '@gym/shared';

interface TurnoCardProps {
  turno: ITurnoConOcupacion;
  /** Solo socios activos: el backend rechaza inactivos (400). */
  sociosActivos: ISocio[];
  assigning: boolean;
  unassigningId: string | null;
  onAssign: (turnoId: string, socioId: string) => void;
  onUnassign: (reservaId: string) => void;
  onDelete: (turno: ITurnoConOcupacion) => void;
  /** Variante densa para grilla semanal por día (muestra solo horario). */
  compact?: boolean;
}

function horaFin(horaInicio: string): string {
  const [horas, minutos] = horaInicio.split(':').map(Number);
  const totalMinutos = (horas * 60 + minutos + TURNO_DURACION_MINUTOS) % (24 * 60);
  return `${String(Math.floor(totalMinutos / 60)).padStart(2, '0')}:${String(totalMinutos % 60).padStart(2, '0')}`;
}

/**
 * Tarjeta de turno (grupo semanal fijo) con ocupación, alumnos y
 * alta/baja de alumnos. Presentacional: fetching y reglas en hook/servicio.
 */
export function TurnoCard({ turno, sociosActivos, assigning, unassigningId, onAssign, onUnassign, onDelete, compact = false }: TurnoCardProps) {
  const [selected, setSelected] = useState('');

  const lleno = turno.ocupados >= turno.cupoMax;
  const ratio = turno.cupoMax > 0 ? turno.ocupados / turno.cupoMax : 0;
  const horario = `${turno.horaInicio} a ${horaFin(turno.horaInicio)}`;
  const barClass = lleno ? 'bg-red-400' : ratio >= 0.8 ? 'bg-amber-400' : 'bg-emerald-400';
  const badgeClass = lleno
    ? 'border-red-900/60 bg-red-950/60 text-red-200'
    : 'border-zinc-700 bg-zinc-800 text-zinc-200';

  // Socios activos aún no integrados al grupo.
  const asignados = new Set(turno.reservas.map((r) => r.socioId));
  const disponibles = sociosActivos.filter((s) => !asignados.has(s.id));

  return (
    <article className={`flex flex-col rounded-xl border border-zinc-800 bg-zinc-900 ${compact ? 'p-3' : 'p-5'}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className={`font-semibold text-zinc-100 ${compact ? 'text-sm' : 'text-base'}`}>
            {compact ? (
              <span className="font-mono">{horario}</span>
            ) : (
              <>{turno.dia} <span className="font-mono text-zinc-300">({horario})</span></>
            )}
          </h3>
          {compact ? null : <p className="mt-0.5 text-xs text-zinc-500">Grupo semanal · 1 hora</p>}
        </div>
        <span className={`shrink-0 rounded-full border font-semibold ${badgeClass} ${compact ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'}`}>
          {turno.ocupados}/{turno.cupoMax}
        </span>
      </div>

      <div className={`${compact ? 'mt-2' : 'mt-3'} h-1.5 overflow-hidden rounded-full bg-zinc-800`} role="progressbar" aria-valuenow={turno.ocupados} aria-valuemin={0} aria-valuemax={turno.cupoMax}>
        <div className={`h-full rounded-full transition-all ${barClass}`} style={{ width: `${Math.min(100, ratio * 100)}%` }} />
      </div>
      {lleno ? <p className="mt-2 text-xs font-medium text-red-300">Cupo lleno.</p> : null}

      <div className={`${compact ? 'mt-3' : 'mt-4'} flex-1`}>
        {turno.reservas.length === 0 ? (
          <p className="text-xs text-zinc-500">Sin alumnos asignados todavía.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {turno.reservas.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs">
                <span className="min-w-0">
                  <span className="block truncate font-medium text-zinc-200">{r.socio.nombre}</span>
                  <span className="font-mono text-zinc-500">{r.socio.dni}</span>
                </span>
                <button
                  type="button"
                  disabled={unassigningId === r.id}
                  onClick={() => onUnassign(r.id)}
                  title="Quitar alumno del turno"
                  className="shrink-0 rounded-md px-2 py-1 text-[11px] text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-red-300 disabled:opacity-50"
                >
                  {unassigningId === r.id ? '…' : 'Quitar'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={`${compact ? 'mt-3 gap-1.5' : 'mt-4 gap-2'} flex`}>
        <select
          aria-label={`Agregar alumno al turno ${turno.dia} ${horario}`}
          className={`min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 text-zinc-100 outline-none transition-colors focus:border-zinc-500 disabled:opacity-50 ${compact ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm'}`}
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          disabled={assigning || lleno || disponibles.length === 0}
        >
          <option value="">{lleno ? 'Cupo lleno' : disponibles.length === 0 ? 'Sin socios disponibles' : 'Agregar alumno…'}</option>
          {disponibles.map((s) => (
            <option key={s.id} value={s.id}>{s.nombre} · {s.dni}</option>
          ))}
        </select>
        <button
          type="button"
          disabled={assigning || !selected || lleno}
          onClick={() => { if (selected) { onAssign(turno.id, selected); setSelected(''); } }}
          className={`shrink-0 rounded-lg bg-emerald-400 font-semibold text-zinc-950 transition-colors hover:bg-emerald-300 disabled:opacity-50 ${compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'}`}
        >
          {assigning ? '…' : 'Agregar'}
        </button>
      </div>

      <button
        type="button"
        onClick={() => onDelete(turno)}
        className={`self-end text-zinc-500 transition-colors hover:text-red-300 ${compact ? 'mt-2 text-[11px]' : 'mt-3 text-xs'}`}
      >
        Eliminar turno
      </button>
    </article>
  );
}
