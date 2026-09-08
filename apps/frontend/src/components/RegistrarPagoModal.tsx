import { useState, type FormEvent } from 'react';
import { METODOS_PAGO, type CreatePagoDTO, type ISocio, type MetodoPago, type RegistrarPagoResult } from '@gym/shared';

interface RegistrarPagoModalProps {
  socio: ISocio;
  submitting: boolean;
  onSubmit: (input: CreatePagoDTO) => Promise<RegistrarPagoResult | null>;
  onClose: () => void;
}

const inputClass =
  'w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition-colors focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500';

const labelClass = 'mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-400';

/**
 * Modal pequeño para registrar un pago total.
 * Solo pide monto y método; socioId y vigencia los resuelve el backend.
 */
export function RegistrarPagoModal({ socio, submitting, onSubmit, onClose }: RegistrarPagoModalProps) {
  const [monto, setMonto] = useState('');
  const [metodo, setMetodo] = useState<MetodoPago>('EFECTIVO');
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    const parsed = Number(monto.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setLocalError('Ingresa un monto mayor a 0.');
      return;
    }
    setLocalError(null);
    await onSubmit({ socioId: socio.id, monto: Math.round(parsed * 100) / 100, metodo });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-xl border border-zinc-700 bg-zinc-900 p-6">
        <h2 className="text-base font-semibold text-zinc-100">Registrar pago</h2>
        <p className="mt-1 text-sm text-zinc-400">
          {socio.nombre} · <span className="font-mono">{socio.dni}</span>
        </p>
        {!socio.activo ? (
          <p className="mt-2 rounded-lg border border-emerald-900/60 bg-emerald-950/50 px-3 py-2 text-xs text-emerald-200">
            El pago reactivará a este socio y le otorgará 1 mes de membresía.
          </p>
        ) : (
          <p className="mt-2 text-xs text-zinc-500">Otorga 1 mes de membresía (extiende la vigente si aplica).</p>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-4">
          <div>
            <label htmlFor="pago-monto" className={labelClass}>Monto *</label>
            <input
              id="pago-monto"
              className={inputClass}
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="Ej. 15000"
              inputMode="decimal"
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="pago-metodo" className={labelClass}>Método *</label>
            <select
              id="pago-metodo"
              className={inputClass}
              value={metodo}
              onChange={(e) => setMetodo(e.target.value as MetodoPago)}
            >
              {METODOS_PAGO.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {localError ? (
            <p role="alert" className="rounded-lg border border-red-900/60 bg-red-950/50 px-3 py-2 text-sm text-red-200">
              {localError}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-300 disabled:opacity-50"
            >
              {submitting ? 'Registrando…' : 'Confirmar pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
