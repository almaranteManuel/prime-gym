import { useRef, useState, type FormEvent } from 'react';
import type { CreateRutinaDTO, IDiaRutina } from '@gym/shared';

interface FilaEjercicio {
  key: number;
  ejercicio: string;
  series: string;
  repeticiones: string;
  notas: string;
}

interface BloqueDraft {
  key: number;
  nombre: string;
  filas: FilaEjercicio[];
}

interface DiaDraft {
  key: number;
  nombre: string;
  etapa: string;
  objetivo: string;
  bloques: BloqueDraft[];
}

interface RutinaBuilderProps {
  socioId: string;
  socioNombre: string;
  /** Días/semana del socio (sugerencia inicial; null = se pregunta). */
  diasSugeridos: number | null;
  submitting: boolean;
  onSubmit: (input: CreateRutinaDTO) => void;
  onClose: () => void;
}

const inputClass =
  'w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition-colors focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500';

const labelClass = 'mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-400';

let nextKey = 1;

function nuevaFila(): FilaEjercicio {
  return { key: nextKey++, ejercicio: '', series: '', repeticiones: '', notas: '' };
}

function nuevoBloque(nombre: string): BloqueDraft {
  return { key: nextKey++, nombre, filas: [nuevaFila()] };
}

function nuevoDia(nombre: string): DiaDraft {
  return { key: nextKey++, nombre, etapa: '', objetivo: '', bloques: [nuevoBloque('Bloque 1')] };
}

function filaVacia(f: FilaEjercicio): boolean {
  return !f.ejercicio.trim() && !f.series.trim() && !f.repeticiones.trim() && !f.notas.trim();
}

/**
 * Constructor de rutinas a pantalla completa (DÍA → BLOQUE → ejercicios).
 * Arranca con N días según la frecuencia del socio (o la elige el dueño),
 * cada día con un bloque de una fila; luego se agregan filas, bloques y días.
 */
export function RutinaBuilder({ socioId, socioNombre, diasSugeridos, submitting, onSubmit, onClose }: RutinaBuilderProps) {
  const inicial = diasSugeridos !== null && diasSugeridos >= 1 ? diasSugeridos : 0;
  const [dias, setDias] = useState<DiaDraft[]>(() =>
    Array.from({ length: inicial }, (_, i) => nuevoDia(`DÍA ${i + 1}`)),
  );
  const [empezado, setEmpezado] = useState(inicial > 0);
  const [cantidad, setCantidad] = useState('3');
  const [titulo, setTitulo] = useState('');
  const [diaActivoKey, setDiaActivoKey] = useState<number | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const siguienteDia = useRef(inicial + 1);

  const diaActivo = dias.find((d) => d.key === diaActivoKey) ?? dias[0] ?? null;

  function empezar(): void {
    const n = Number(cantidad);
    if (!Number.isInteger(n) || n < 1) {
      setLocalError('La cantidad de días debe ser un entero mayor o igual a 1.');
      return;
    }
    setLocalError(null);
    setDias(Array.from({ length: n }, (_, i) => nuevoDia(`DÍA ${i + 1}`)));
    siguienteDia.current = n + 1;
    setDiaActivoKey(null);
    setEmpezado(true);
  }

  function cerrar(): void {
    const hayContenido =
      titulo.trim() !== '' ||
      dias.some(
        (d) =>
          d.etapa.trim() !== '' ||
          d.objetivo.trim() !== '' ||
          d.bloques.some((b) => b.filas.some((f) => !filaVacia(f))),
      );
    if (!hayContenido || window.confirm('Hay cambios sin guardar. ¿Salir sin guardar la rutina?')) onClose();
  }

  function actualizarDia(key: number, patch: Partial<DiaDraft>): void {
    setDias((prev) => prev.map((d) => (d.key === key ? { ...d, ...patch } : d)));
  }

  function agregarDia(): void {
    const dia = nuevoDia(`DÍA ${siguienteDia.current++}`);
    setDias((prev) => [...prev, dia]);
    setDiaActivoKey(dia.key);
  }

  function quitarDia(key: number): void {
    setDias((prev) => (prev.length <= 1 ? prev : prev.filter((d) => d.key !== key)));
  }

  function actualizarBloque(diaKey: number, bloqueKey: number, patch: Partial<BloqueDraft>): void {
    setDias((prev) =>
      prev.map((d) =>
        d.key === diaKey
          ? { ...d, bloques: d.bloques.map((b) => (b.key === bloqueKey ? { ...b, ...patch } : b)) }
          : d,
      ),
    );
  }

  function agregarBloque(diaKey: number): void {
    setDias((prev) =>
      prev.map((d) => {
        if (d.key !== diaKey) return d;
        return { ...d, bloques: [...d.bloques, nuevoBloque(`Bloque ${d.bloques.length + 1}`)] };
      }),
    );
  }

  function quitarBloque(diaKey: number, bloqueKey: number): void {
    setDias((prev) =>
      prev.map((d) =>
        d.key === diaKey && d.bloques.length > 1
          ? { ...d, bloques: d.bloques.filter((b) => b.key !== bloqueKey) }
          : d,
      ),
    );
  }

  function actualizarFila(diaKey: number, bloqueKey: number, filaKey: number, campo: keyof Omit<FilaEjercicio, 'key'>, valor: string): void {
    setDias((prev) =>
      prev.map((d) =>
        d.key === diaKey
          ? {
              ...d,
              bloques: d.bloques.map((b) =>
                b.key === bloqueKey
                  ? { ...b, filas: b.filas.map((f) => (f.key === filaKey ? { ...f, [campo]: valor } : f)) }
                  : b,
              ),
            }
          : d,
      ),
    );
  }

  function agregarFila(diaKey: number, bloqueKey: number): void {
    setDias((prev) =>
      prev.map((d) =>
        d.key === diaKey
          ? { ...d, bloques: d.bloques.map((b) => (b.key === bloqueKey ? { ...b, filas: [...b.filas, nuevaFila()] } : b)) }
          : d,
      ),
    );
  }

  function quitarFila(diaKey: number, bloqueKey: number, filaKey: number): void {
    setDias((prev) =>
      prev.map((d) =>
        d.key === diaKey
          ? {
              ...d,
              bloques: d.bloques.map((b) =>
                b.key === bloqueKey && b.filas.length > 1
                  ? { ...b, filas: b.filas.filter((f) => f.key !== filaKey) }
                  : b,
              ),
            }
          : d,
      ),
    );
  }

  function handleSubmit(e: FormEvent): void {
    e.preventDefault();
    if (!titulo.trim()) {
      setLocalError('El título es obligatorio (ej. Hipertrofia - 4 días).');
      return;
    }
    if (dias.length === 0) {
      setLocalError('La rutina debe tener al menos un día.');
      return;
    }
    const diasFinales: IDiaRutina[] = [];
    for (const d of dias) {
      if (!d.nombre.trim()) {
        setLocalError('Cada día necesita un nombre (ej. DÍA 1).');
        return;
      }
      if (d.bloques.length === 0) {
        setLocalError(`El día ${d.nombre.trim()} debe tener al menos un bloque.`);
        return;
      }
      const bloques = [];
      for (const b of d.bloques) {
        if (!b.nombre.trim()) {
          setLocalError(`Hay un bloque sin nombre en ${d.nombre.trim()}.`);
          return;
        }
        const ejercicios = [];
        for (const f of b.filas) {
          if (filaVacia(f)) continue;
          if (!f.ejercicio.trim()) {
            setLocalError(`Hay una fila con datos pero sin ejercicio en ${d.nombre.trim()} · ${b.nombre.trim()}.`);
            return;
          }
          ejercicios.push({
            ejercicio: f.ejercicio.trim(),
            series: f.series.trim(),
            repeticiones: f.repeticiones.trim(),
            notas: f.notas.trim(),
          });
        }
        if (ejercicios.length === 0) {
          setLocalError(`El bloque ${b.nombre.trim()} (${d.nombre.trim()}) debe tener al menos un ejercicio.`);
          return;
        }
        bloques.push({ nombre: b.nombre.trim(), ejercicios });
      }
      diasFinales.push({ nombre: d.nombre.trim(), etapa: d.etapa.trim(), objetivo: d.objetivo.trim(), bloques });
    }
    setLocalError(null);
    onSubmit({ socioId, titulo: titulo.trim(), dias: diasFinales });
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950 text-zinc-100" role="dialog" aria-modal="true" aria-label={`Nueva rutina para ${socioNombre}`}>
      <form onSubmit={handleSubmit} className="mx-auto min-h-full max-w-6xl px-4 py-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Nueva rutina</h1>
            <p className="mt-1 text-sm text-zinc-400">{socioNombre}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={cerrar}
              disabled={submitting}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800 disabled:opacity-50"
            >
              ← Volver
            </button>
            {empezado ? (
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-300 disabled:opacity-50"
              >
                {submitting ? 'Guardando…' : 'Guardar rutina'}
              </button>
            ) : null}
          </div>
        </header>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="builder-titulo" className={labelClass}>Título *</label>
            <input
              id="builder-titulo"
              className={inputClass}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Hipertrofia - 4 días"
              maxLength={120}
              autoComplete="off"
            />
          </div>
          {empezado ? null : (
            <div>
              <label htmlFor="builder-cantidad" className={labelClass}>¿Cuántos días entrena? *</label>
              <div className="flex gap-2">
                <input
                  id="builder-cantidad"
                  className={inputClass}
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  placeholder="Ej. 4"
                  inputMode="numeric"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={empezar}
                  className="shrink-0 rounded-lg bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-900 transition-colors hover:bg-white"
                >
                  Empezar
                </button>
              </div>
            </div>
          )}
        </div>

        {localError ? (
          <p role="alert" className="mt-4 rounded-lg border border-red-900/60 bg-red-950/50 px-3 py-2 text-sm text-red-200">
            {localError}
          </p>
        ) : null}

        {empezado && diaActivo ? (
          <>
            <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Días de la rutina">
              {dias.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  role="tab"
                  aria-selected={d.key === diaActivo.key}
                  onClick={() => setDiaActivoKey(d.key)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                    d.key === diaActivo.key
                      ? 'bg-zinc-100 text-zinc-900'
                      : 'border border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  {d.nombre.trim() || 'DÍA ?'}
                </button>
              ))}
              <button
                type="button"
                onClick={agregarDia}
                className="rounded-lg border border-dashed border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
              >
                + Día
              </button>
            </div>

            <section key={diaActivo.key} aria-label={diaActivo.nombre} className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor={`dia-nombre-${diaActivo.key}`} className={labelClass}>Día *</label>
                  <input
                    id={`dia-nombre-${diaActivo.key}`}
                    className={inputClass}
                    value={diaActivo.nombre}
                    onChange={(e) => actualizarDia(diaActivo.key, { nombre: e.target.value })}
                    maxLength={40}
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label htmlFor={`dia-etapa-${diaActivo.key}`} className={labelClass}>Etapa</label>
                  <input
                    id={`dia-etapa-${diaActivo.key}`}
                    className={inputClass}
                    value={diaActivo.etapa}
                    onChange={(e) => actualizarDia(diaActivo.key, { etapa: e.target.value })}
                    placeholder="Ej. Adaptación"
                    maxLength={120}
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label htmlFor={`dia-objetivo-${diaActivo.key}`} className={labelClass}>Objetivo</label>
                  <input
                    id={`dia-objetivo-${diaActivo.key}`}
                    className={inputClass}
                    value={diaActivo.objetivo}
                    onChange={(e) => actualizarDia(diaActivo.key, { objetivo: e.target.value })}
                    placeholder="Ej. Técnica"
                    maxLength={200}
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-4">
                {diaActivo.bloques.map((b) => (
                  <fieldset key={b.key} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        aria-label="Nombre del bloque"
                        className="w-full max-w-xs rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm font-semibold text-zinc-100 outline-none transition-colors focus:border-zinc-500"
                        value={b.nombre}
                        onChange={(e) => actualizarBloque(diaActivo.key, b.key, { nombre: e.target.value })}
                        placeholder="Nombre del bloque"
                        maxLength={120}
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        onClick={() => quitarBloque(diaActivo.key, b.key)}
                        disabled={diaActivo.bloques.length <= 1}
                        className="shrink-0 text-xs text-zinc-500 transition-colors hover:text-red-300 disabled:opacity-30"
                      >
                        Quitar bloque
                      </button>
                    </div>

                    <div className="mt-3 hidden grid-cols-12 gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500 sm:grid">
                      <span className="col-span-5">Ejercicio</span>
                      <span className="col-span-2">Series</span>
                      <span className="col-span-2">Repeticiones</span>
                      <span className="col-span-2">Notas</span>
                      <span className="col-span-1" />
                    </div>
                    <div className="mt-2 flex flex-col gap-2">
                      {b.filas.map((f) => (
                        <div key={f.key} className="grid grid-cols-1 gap-2 sm:grid-cols-12">
                          <input
                            aria-label="Ejercicio"
                            className={`${inputClass} sm:col-span-5`}
                            value={f.ejercicio}
                            onChange={(e) => actualizarFila(diaActivo.key, b.key, f.key, 'ejercicio', e.target.value)}
                            placeholder="Ejercicio (ej. Press banca)"
                            maxLength={120}
                            autoComplete="off"
                          />
                          <input
                            aria-label="Series"
                            className={`${inputClass} sm:col-span-2`}
                            value={f.series}
                            onChange={(e) => actualizarFila(diaActivo.key, b.key, f.key, 'series', e.target.value)}
                            placeholder="Series"
                            maxLength={20}
                            autoComplete="off"
                          />
                          <input
                            aria-label="Repeticiones"
                            className={`${inputClass} sm:col-span-2`}
                            value={f.repeticiones}
                            onChange={(e) => actualizarFila(diaActivo.key, b.key, f.key, 'repeticiones', e.target.value)}
                            placeholder="Reps"
                            maxLength={20}
                            autoComplete="off"
                          />
                          <input
                            aria-label="Notas"
                            className={`${inputClass} sm:col-span-2`}
                            value={f.notas}
                            onChange={(e) => actualizarFila(diaActivo.key, b.key, f.key, 'notas', e.target.value)}
                            placeholder="Notas"
                            maxLength={500}
                            autoComplete="off"
                          />
                          <button
                            type="button"
                            onClick={() => quitarFila(diaActivo.key, b.key, f.key)}
                            disabled={b.filas.length <= 1}
                            title="Quitar fila"
                            className="rounded-lg px-2 py-1 text-xs text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-red-300 disabled:opacity-30 sm:col-span-1"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => agregarFila(diaActivo.key, b.key)}
                      className="mt-3 rounded-lg border border-dashed border-zinc-700 px-4 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
                    >
                      + Agregar fila
                    </button>
                  </fieldset>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap justify-between gap-2">
                <button
                  type="button"
                  onClick={() => agregarBloque(diaActivo.key)}
                  className="rounded-lg border border-dashed border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
                >
                  + Agregar bloque
                </button>
                <button
                  type="button"
                  onClick={() => quitarDia(diaActivo.key)}
                  disabled={dias.length <= 1}
                  className="rounded-lg px-4 py-2 text-sm text-zinc-500 transition-colors hover:text-red-300 disabled:opacity-30"
                >
                  Quitar este día
                </button>
              </div>
            </section>
          </>
        ) : null}
      </form>
    </div>
  );
}
