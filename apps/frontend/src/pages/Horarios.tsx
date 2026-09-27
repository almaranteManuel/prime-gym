import { useMemo, useState } from 'react';
import type { CreateTurnoDTO, DiaSemana, ITurnoConOcupacion } from '@gym/shared';
import { useSocios } from '../hooks/useSocios.js';
import { useTurnos } from '../hooks/useTurnos.js';
import { TurnoForm } from '../components/TurnoForm.js';
import { TurnoCard } from '../components/TurnoCard.js';

/** Columnas fijas de la grilla semanal (el gym no opera domingos). */
const DIAS_COLUMNAS: DiaSemana[] = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];

/**
 * Gestión de horarios: alta de turnos y asignación de alumnos.
 * Los turnos son grupos semanales fijos (sin fecha): quien se anota un
 * lunes a las 18:00, asiste todos los lunes a las 18:00.
 * El selector solo ofrece socios activos (`socio.activo`).
 */
export function Horarios() {
  const { turnos, loading, error, refresh, create, remove, assign, unassign, clearError } = useTurnos();
  const { socios } = useSocios();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [unassigningId, setUnassigningId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ITurnoConOcupacion | null>(null);

  const sociosActivos = useMemo(() => socios.filter((s) => s.activo), [socios]);

  const turnosPorDia = useMemo(() => {
    const agrupados = {} as Record<DiaSemana, ITurnoConOcupacion[]>;
    for (const dia of DIAS_COLUMNAS) agrupados[dia] = [];
    for (const turno of turnos) {
      if (agrupados[turno.dia]) agrupados[turno.dia].push(turno);
    }
    for (const dia of DIAS_COLUMNAS) agrupados[dia].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
    return agrupados;
  }, [turnos]);

  async function handleCreate(values: CreateTurnoDTO): Promise<void> {
    setSubmitting(true);
    try {
      const ok = await create(values);
      if (ok) setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAssign(turnoId: string, socioId: string): Promise<void> {
    setAssigningId(turnoId);
    try {
      await assign(turnoId, socioId);
    } finally {
      setAssigningId(null);
    }
  }

  async function handleConfirmDelete(): Promise<void> {
    if (!confirmDelete) return;
    const ok = await remove(confirmDelete.id);
    if (ok) setConfirmDelete(null);
  }

  async function handleUnassign(reservaId: string): Promise<void> {
    setUnassigningId(reservaId);
    try {
      await unassign(reservaId);
    } finally {
      setUnassigningId(null);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Horarios</h1>
            <p className="mt-1 text-sm text-zinc-400">Grupos horarios semanales y asignación de alumnos activos.</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={loading}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800 disabled:opacity-50"
            >
              {loading ? 'Cargando…' : 'Recargar'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm((v) => !v); clearError(); }}
              className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-900 transition-colors hover:bg-white"
            >
              + Nuevo turno
            </button>
          </div>
        </header>

        {error ? (
          <p role="alert" className="mt-4 rounded-xl border border-red-900/60 bg-red-950/50 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        {showForm ? (
          <div className="mt-6">
            <TurnoForm
              submitting={submitting}
              formError={null}
              onSubmit={(values) => void handleCreate(values)}
              onCancel={() => setShowForm(false)}
            />
          </div>
        ) : null}

        <div className="mt-6">
          {loading && turnos.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
              <p className="text-sm text-zinc-400">Cargando turnos…</p>
            </div>
          ) : turnos.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
              <p className="text-sm text-zinc-400">No hay turnos. Crea el primero (ej. Lunes 18:00, cupo 5).</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {DIAS_COLUMNAS.map((dia) => {
                const delDia = turnosPorDia[dia];
                return (
                  <section key={dia} aria-label={`Turnos del ${dia}`} className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/40 p-2">
                    <header className="flex items-center justify-between px-1 pb-2 pt-1">
                      <h2 className="text-xs font-bold uppercase tracking-wide text-zinc-300">{dia}</h2>
                      <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[11px] font-semibold text-zinc-300">
                        {delDia.length}
                      </span>
                    </header>
                    <div className="flex flex-1 flex-col gap-3">
                      {delDia.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-zinc-800 px-2 py-4 text-center text-[11px] text-zinc-500">
                          Sin turnos
                        </p>
                      ) : (
                        delDia.map((turno) => (
                          <TurnoCard
                            key={turno.id}
                            turno={turno}
                            sociosActivos={sociosActivos}
                            assigning={assigningId === turno.id}
                            unassigningId={unassigningId}
                            compact
                            onAssign={(turnoId, socioId) => void handleAssign(turnoId, socioId)}
                            onUnassign={(reservaId) => void handleUnassign(reservaId)}
                            onDelete={(t) => setConfirmDelete(t)}
                          />
                        ))
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>

        {confirmDelete ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-6">
              <h2 className="text-base font-semibold">Eliminar turno</h2>
              <p className="mt-2 text-sm text-zinc-400">
                Se eliminará el turno {confirmDelete.dia} {confirmDelete.horaInicio}. Solo es posible si no tiene alumnos asignados.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(null)}
                  className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void handleConfirmDelete()}
                  className="rounded-lg border border-red-800 bg-red-950 px-4 py-2 text-sm font-semibold text-red-100 hover:bg-red-900"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
