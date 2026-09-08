import { useState, type FormEvent } from 'react';
import type { CreateRutinaDTO, IEjercicioRutina, ISocio } from '@gym/shared';

interface FilaEjercicio {
  key: number;
  ejercicio: string;
  series: string;
  repeticiones: string;
  notas: string;
}

interface RutinaFormProps {
  sociosActivos: ISocio[];
  preselectedSocioId: string;
  submitting: boolean;
  onSubmit: (input: CreateRutinaDTO) => void;
  onCancel: () => void;
}

const inputClass =
  'w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition-colors focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500';

const labelClass = 'mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-400';

let nextKey = 1;
function filaVacia(): FilaEjercicio {
  return { key: nextKey++, ejercicio: '', series: '', repeticiones: '', notas: '' };
}

/**
 * Alta de rutina: socio activo + título + filas dinámicas de ejercicios.
 * La validación definitiva vive en el backend.
 */
export function RutinaForm({ sociosActivos, preselectedSocioId, submitting, onSubmit, onCancel }: RutinaFormProps) {
  const [socioId, setSocioId] = useState(preselectedSocioId);
  const [titulo, setTitulo] = useState('');
  const [filas, setFilas] = useState<FilaEjercicio[]>([filaVacia()]);
  const [localError, setLocalError] = useState<string | null>(null);

  function setFila(key: number, campo: keyof Omit<FilaEjercicio, 'key'>, valor: string): void {
    setFilas((prev) => prev.map((f) => (f.key === key ? { ...f, [campo]: valor } : f)));
  }

  function agregarFila(): void {
    setFilas((prev) => [...prev, filaVacia()]);
  }

  function quitarFila(key: number): void {
    setFilas((prev) => (prev.length <= 1 ? prev : prev.filter((f) => f.key !== key)));
  }

  function handleSubmit(e: FormEvent): void {
    e.preventDefault();
    if (!socioId) {
      setLocalError('Elegí un socio activo.');
      return;
    }
    if (!titulo.trim()) {
      setLocalError('El título es obligatorio (ej. Fuerza - Día 1).');
      return;
    }
    const ejercicios: IEjercicioRutina[] = [];
    for (let i = 0; i < filas.length; i++) {
      const f = filas[i];
      if (!f.ejercicio.trim()) {
        setLocalError(`La fila #${i + 1} necesita al menos el nombre del ejercicio.`);
        return;
      }
      ejercicios.push({
        ejercicio: f.ejercicio.trim(),
        series: f.series.trim(),
        repeticiones: f.repeticiones.trim(),
        notas: f.notas.trim(),
      });
    }
    setLocalError(null);
    onSubmit({ socioId, titulo: titulo.trim(), ejercicios });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <h3 className="text-base font-semibold text-zinc-100">Nueva rutina</h3>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="rutina-socio" className={labelClass}>Socio *</label>
          <select id="rutina-socio" className={inputClass} value={socioId} onChange={(e) => setSocioId(e.target.value)}>
            <option value="">Elegir socio activo…</option>
            {sociosActivos.map((s) => (
              <option key={s.id} value={s.id}>{s.nombre} · {s.dni}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="rutina-titulo" className={labelClass}>Título *</label>
          <input
            id="rutina-titulo"
            className={inputClass}
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Fuerza - Día 1"
            maxLength={120}
            autoComplete="off"
          />
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {filas.map((f, i) => (
          <fieldset key={f.key} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
            <div className="mb-2 flex items-center justify-between">
              <legend className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Ejercicio #{i + 1}</legend>
              <button
                type="button"
                onClick={() => quitarFila(f.key)}
                disabled={filas.length <= 1}
                className="text-xs text-zinc-500 transition-colors hover:text-red-300 disabled:opacity-30"
              >
                Quitar
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input className={inputClass} value={f.ejercicio} onChange={(e) => setFila(f.key, 'ejercicio', e.target.value)} placeholder="Ejercicio * (ej. Press banca)" maxLength={120} autoComplete="off" />
              <input className={inputClass} value={f.series} onChange={(e) => setFila(f.key, 'series', e.target.value)} placeholder="Series (ej. 4)" maxLength={20} autoComplete="off" />
              <input className={inputClass} value={f.repeticiones} onChange={(e) => setFila(f.key, 'repeticiones', e.target.value)} placeholder="Repeticiones (ej. 8-10)" maxLength={20} autoComplete="off" />
              <input className={inputClass} value={f.notas} onChange={(e) => setFila(f.key, 'notas', e.target.value)} placeholder="Notas (opcional)" maxLength={500} autoComplete="off" />
            </div>
          </fieldset>
        ))}
      </div>

      <button
        type="button"
        onClick={agregarFila}
        className="mt-3 rounded-lg border border-dashed border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
      >
        + Agregar ejercicio
      </button>

      {localError ? (
        <p role="alert" className="mt-3 rounded-lg border border-red-900/60 bg-red-950/50 px-3 py-2 text-sm text-red-200">
          {localError}
        </p>
      ) : null}

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-900 transition-colors hover:bg-white disabled:opacity-50"
        >
          {submitting ? 'Guardando…' : 'Guardar rutina'}
        </button>
      </div>
    </form>
  );
}
