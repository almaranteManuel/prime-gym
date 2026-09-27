import { useEffect, useState } from 'react';
import type { CreateRutinaDTO, IRutina, ISocio } from '@gym/shared';
import { useRutinas } from '../hooks/useRutinas.js';
import { RutinaBuilder } from './RutinaBuilder.js';
import { RutinaDetalle, contarEjercicios } from './RutinaDetalle.js';

interface RutinasModalProps {
  socioInicial: ISocio;
  sociosActivos: ISocio[];
  onClose: () => void;
}

type Vista = { kind: 'lista' } | { kind: 'nueva' } | { kind: 'detalle'; rutina: IRutina };

/**
 * Gestión de rutinas del alumno: lista, alta (constructor a pantalla
 * completa) y detalle con PDF. El backend valida el resto.
 */
export function RutinasModal({ socioInicial, sociosActivos, onClose }: RutinasModalProps) {
  const [socioId, setSocioId] = useState(socioInicial.id);
  const [vista, setVista] = useState<Vista>({ kind: 'lista' });
  const [submitting, setSubmitting] = useState(false);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);
  const { rutinas, loading, error, create, remove, clearError } = useRutinas(socioId);

  useEffect(() => {
    setVista({ kind: 'lista' });
    setConfirmandoId(null);
  }, [socioId]);

  async function handleCreate(input: CreateRutinaDTO): Promise<void> {
    setSubmitting(true);
    try {
      const creada = await create(input);
      if (creada) {
        if (creada.socioId !== socioId) setSocioId(creada.socioId);
        setVista({ kind: 'detalle', rutina: creada });
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string): Promise<void> {
    setEliminandoId(id);
    try {
      const ok = await remove(id);
      if (ok) {
        setConfirmandoId(null);
        if (vista.kind === 'detalle' && vista.rutina.id === id) setVista({ kind: 'lista' });
      }
    } finally {
      setEliminandoId(null);
    }
  }

  const socioNombre = sociosActivos.find((s) => s.id === socioId)?.nombre ?? 'Socio';

  // El alta usa el constructor a pantalla completa (reemplaza el modal).
  if (vista.kind === 'nueva') {
    const socio = sociosActivos.find((s) => s.id === socioId);
    return (
      <RutinaBuilder
        socioId={socioId}
        socioNombre={socio?.nombre ?? socioNombre}
        diasSugeridos={socio?.diasEntrenamiento ?? null}
        submitting={submitting}
        onSubmit={(input) => void handleCreate(input)}
        onClose={() => setVista({ kind: 'lista' })}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-950 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-100">Rutinas · {socioNombre}</h2>
            <p className="mt-0.5 text-xs text-zinc-500">Planes personalizados y exportación a PDF.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700"
          >
            Cerrar
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <select
            aria-label="Alumno"
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
            value={socioId}
            onChange={(e) => { setSocioId(e.target.value); clearError(); }}
          >
            {sociosActivos.map((s) => (
              <option key={s.id} value={s.id}>{s.nombre} · {s.dni}</option>
            ))}
          </select>
          <div className="ml-auto flex gap-2">
            {vista.kind !== 'lista' ? (
              <button type="button" onClick={() => setVista({ kind: 'lista' })} className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800">
                ← Volver
              </button>
            ) : null}
            {vista.kind === 'lista' ? (
              <button type="button" onClick={() => setVista({ kind: 'nueva' })} className="rounded-lg bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-900 hover:bg-white">
                + Nueva rutina
              </button>
            ) : null}
          </div>
        </div>

        {error ? (
          <p role="alert" className="mt-4 rounded-lg border border-red-900/60 bg-red-950/50 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        <div className="mt-4">
          {vista.kind === 'detalle' ? (
            <div>
              <div className="mb-3 flex justify-end">
                {confirmandoId === vista.rutina.id ? (
                  <span className="flex items-center gap-2 text-xs">
                    <span className="text-zinc-400">¿Eliminar esta rutina?</span>
                    <button
                      type="button"
                      disabled={eliminandoId === vista.rutina.id}
                      onClick={() => void handleDelete(vista.rutina.id)}
                      className="rounded-lg bg-red-600 px-3 py-1.5 font-semibold text-white hover:bg-red-500 disabled:opacity-50"
                    >
                      {eliminandoId === vista.rutina.id ? 'Eliminando…' : 'Sí, eliminar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmandoId(null)}
                      className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 font-medium text-zinc-300 hover:bg-zinc-800"
                    >
                      No
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmandoId(vista.rutina.id)}
                    className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-1.5 text-xs font-medium text-red-200 hover:bg-red-950/70"
                  >
                    Eliminar rutina
                  </button>
                )}
              </div>
              <RutinaDetalle rutina={vista.rutina} />
            </div>
          ) : loading ? (
            <p className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center text-sm text-zinc-400">Cargando rutinas…</p>
          ) : rutinas.length === 0 ? (
            <p className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center text-sm text-zinc-400">Sin rutinas todavía.</p>
          ) : (
            <div>
              <p className="mb-2 text-xs text-zinc-500">
                {rutinas.length} {rutinas.length === 1 ? 'rutina' : 'rutinas'} · las más recientes primero
              </p>
              <ul className="flex max-h-[45vh] flex-col gap-2 overflow-y-auto pr-1">
                {rutinas.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 transition-colors hover:border-zinc-600"
                  >
                    <button
                      type="button"
                      onClick={() => { setConfirmandoId(null); setVista({ kind: 'detalle', rutina: r }); }}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span className="block truncate text-sm font-medium text-zinc-100">{r.titulo}</span>
                      <span className="block text-xs text-zinc-500">
                        {new Date(r.fechaCreacion).toLocaleDateString('es-AR')} · {r.dias.length} días · {contarEjercicios(r)} ejercicios
                      </span>
                    </button>
                    <span className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => { setConfirmandoId(null); setVista({ kind: 'detalle', rutina: r }); }}
                        className="text-xs text-zinc-400 hover:text-zinc-200"
                      >
                        Ver →
                      </button>
                      {confirmandoId === r.id ? (
                        <>
                          <button
                            type="button"
                            disabled={eliminandoId === r.id}
                            onClick={() => void handleDelete(r.id)}
                            className="rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50"
                          >
                            {eliminandoId === r.id ? '…' : 'Sí'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmandoId(null)}
                            className="rounded-lg border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
                          >
                            No
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          aria-label={`Eliminar ${r.titulo}`}
                          onClick={() => setConfirmandoId(r.id)}
                          className="rounded-lg border border-zinc-700 px-2.5 py-1.5 text-xs text-red-300 hover:border-red-800 hover:bg-red-950/40 hover:text-red-200"
                        >
                          Eliminar
                        </button>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
