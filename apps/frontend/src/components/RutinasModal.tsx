import { useEffect, useState } from 'react';
import type { CreateRutinaDTO, IRutina, ISocio } from '@gym/shared';
import { useRutinas } from '../hooks/useRutinas.js';
import { RutinaForm } from './RutinaForm.js';
import { RutinaDetalle } from './RutinaDetalle.js';

interface RutinasModalProps {
  socioInicial: ISocio;
  sociosActivos: ISocio[];
  onClose: () => void;
}

type Vista = { kind: 'lista' } | { kind: 'nueva' } | { kind: 'detalle'; rutina: IRutina };

/**
 * Gestión de rutinas del alumno: lista, alta y detalle con PDF.
 * El formulario solo ofrece socios activos; el backend valida el resto.
 */
export function RutinasModal({ socioInicial, sociosActivos, onClose }: RutinasModalProps) {
  const [socioId, setSocioId] = useState(socioInicial.id);
  const [vista, setVista] = useState<Vista>({ kind: 'lista' });
  const [submitting, setSubmitting] = useState(false);
  const { rutinas, loading, error, create, clearError } = useRutinas(socioId);

  useEffect(() => {
    setVista({ kind: 'lista' });
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

  const socioNombre = sociosActivos.find((s) => s.id === socioId)?.nombre ?? 'Socio';

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
          {vista.kind === 'nueva' ? (
            <RutinaForm
              sociosActivos={sociosActivos}
              preselectedSocioId={socioId}
              submitting={submitting}
              onSubmit={(input) => void handleCreate(input)}
              onCancel={() => setVista({ kind: 'lista' })}
            />
          ) : vista.kind === 'detalle' ? (
            <RutinaDetalle rutina={vista.rutina} />
          ) : loading ? (
            <p className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center text-sm text-zinc-400">Cargando rutinas…</p>
          ) : rutinas.length === 0 ? (
            <p className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center text-sm text-zinc-400">Sin rutinas todavía.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {rutinas.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setVista({ kind: 'detalle', rutina: r })}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-left transition-colors hover:border-zinc-600"
                  >
                    <span>
                      <span className="block text-sm font-medium text-zinc-100">{r.titulo}</span>
                      <span className="block text-xs text-zinc-500">
                        {new Date(r.fechaCreacion).toLocaleDateString('es-AR')} · {r.ejercicios.length} ejercicios
                      </span>
                    </span>
                    <span className="text-xs text-zinc-400">Ver →</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
