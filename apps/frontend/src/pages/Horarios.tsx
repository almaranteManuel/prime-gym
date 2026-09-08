import { useMemo, useState } from 'react';
import type { CreateTurnoDTO, ITurnoConOcupacion } from '@gym/shared';
import { useSocios } from '../hooks/useSocios.js';
import { useTurnos } from '../hooks/useTurnos.js';
import { TurnoForm } from '../components/TurnoForm.js';
import { TurnoCard } from '../components/TurnoCard.js';

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
      <div className="mx-auto max-w-5xl px-4 py-8">
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {turnos.map((turno) => (
                <TurnoCard
                  key={turno.id}
                  turno={turno}
                  sociosActivos={sociosActivos}
                  assigning={assigningId === turno.id}
                  unassigningId={unassigningId}
                  onAssign={(turnoId, socioId) => void handleAssign(turnoId, socioId)}
                  onUnassign={(reservaId) => void handleUnassign(reservaId)}
                  onDelete={(t) => setConfirmDelete(t)}
                />
              ))}
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
