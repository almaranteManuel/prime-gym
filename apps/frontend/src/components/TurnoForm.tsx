import { useState, type FormEvent } from 'react';
import { DIAS_SEMANA, TURNO_CUPO_MAX, TURNO_CUPO_MIN, type CreateTurnoDTO, type DiaSemana } from '@gym/shared';

interface TurnoFormProps {
  submitting: boolean;
  formError: string | null;
  onSubmit: (values: CreateTurnoDTO) => void;
  onCancel: () => void;
}

const inputClass =
  'w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition-colors focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500';

const labelClass = 'mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-400';

/**
 * Formulario de alta de turno (presentacional).
 * La validación definitiva vive en el backend; aquí solo se exige
 * presencia y formato básico antes de enviar.
 */
export function TurnoForm({ submitting, formError, onSubmit, onCancel }: TurnoFormProps) {
  const [dia, setDia] = useState<DiaSemana>('LUNES');
  const [horaInicio, setHoraInicio] = useState('18:00');
  const [cupoMax, setCupoMax] = useState('5');
  const [localError, setLocalError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent): void {
    e.preventDefault();
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(horaInicio)) {
      setLocalError('Hora inválida. Usa formato HH:mm (ej. 18:00).');
      return;
    }
    const cupo = Number(cupoMax);
    if (!Number.isInteger(cupo) || cupo < TURNO_CUPO_MIN || cupo > TURNO_CUPO_MAX) {
      setLocalError(`El cupo debe ser un entero entre ${TURNO_CUPO_MIN} y ${TURNO_CUPO_MAX}.`);
      return;
    }
    setLocalError(null);
    onSubmit({ dia, horaInicio, cupoMax: cupo });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="text-base font-semibold text-zinc-100">Nuevo turno</h2>
      <p className="mt-1 text-xs text-zinc-400">Franja semanal recurrente de 1 hora.</p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="turno-dia" className={labelClass}>Día *</label>
          <select id="turno-dia" className={inputClass} value={dia} onChange={(e) => setDia(e.target.value as DiaSemana)}>
            {DIAS_SEMANA.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="turno-hora" className={labelClass}>Hora inicio *</label>
          <input
            id="turno-hora"
            type="time"
            className={inputClass}
            value={horaInicio}
            onChange={(e) => setHoraInicio(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="turno-cupo" className={labelClass}>Cupo máximo *</label>
          <input
            id="turno-cupo"
            type="number"
            min={TURNO_CUPO_MIN}
            max={TURNO_CUPO_MAX}
            step={1}
            className={inputClass}
            value={cupoMax}
            onChange={(e) => setCupoMax(e.target.value)}
          />
        </div>
      </div>

      {localError ? (
        <p role="alert" className="mt-3 rounded-lg border border-red-900/60 bg-red-950/50 px-3 py-2 text-sm text-red-200">
          {localError}
        </p>
      ) : null}
      {formError ? (
        <p role="alert" className="mt-3 rounded-lg border border-red-900/60 bg-red-950/50 px-3 py-2 text-sm text-red-200">
          {formError}
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
          {submitting ? 'Guardando…' : 'Crear turno'}
        </button>
      </div>
    </form>
  );
}
