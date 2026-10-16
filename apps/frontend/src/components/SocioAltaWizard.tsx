import { useEffect, useState } from 'react';
import type { CreateSocioDTO, CreateSocioWithAccessResult, ITurnoConOcupacion } from '@gym/shared';
import { SocioForm, type SocioFormValues } from './SocioForm.js';
import { SocioHorariosSelector } from './SocioHorariosSelector.js';
import { fetchTurnos } from '../services/turnos.service.js';

interface SocioAltaWizardProps {
  submitting: boolean;
  serverError: string | null;
  onSubmit: (values: CreateSocioDTO) => Promise<CreateSocioWithAccessResult | null>;
  onCancel: () => void;
  onClearServerError: () => void;
}

type Paso = 'datos' | 'horarios' | 'listo';

/**
 * Alta de socio en 2 pasos:
 *  1. datos personales (reutiliza SocioForm),
 *  2. horarios libres (multi-selección, omitible).
 * Crea Socio + Usuario ALUMNO + reservas en una sola operación del backend.
 * En el paso 3 muestra el acceso generado (usuario = DNI, clave inicial = DNI).
 */
export function SocioAltaWizard({ submitting, serverError, onSubmit, onCancel, onClearServerError }: SocioAltaWizardProps) {
  const [paso, setPaso] = useState<Paso>('datos');
  const [datos, setDatos] = useState<SocioFormValues | null>(null);
  const [turnoIds, setTurnoIds] = useState<string[]>([]);
  const [turnos, setTurnos] = useState<ITurnoConOcupacion[]>([]);
  const [loadingTurnos, setLoadingTurnos] = useState(false);
  const [turnosError, setTurnosError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<CreateSocioWithAccessResult | null>(null);

  useEffect(() => {
    if (paso !== 'horarios') return;
    let cancelado = false;
    setLoadingTurnos(true);
    setTurnosError(null);
    fetchTurnos()
      .then((data) => {
        if (!cancelado) setTurnos(data);
      })
      .catch((err: unknown) => {
        if (!cancelado) setTurnosError(err instanceof Error ? err.message : 'No se pudieron cargar los turnos');
      })
      .finally(() => {
        if (!cancelado) setLoadingTurnos(false);
      });
    return () => {
      cancelado = true;
    };
  }, [paso]);

  function handleDatos(values: SocioFormValues): void {
    setDatos(values);
    onClearServerError();
    setPaso('horarios');
  }

  function toggleTurno(turnoId: string): void {
    setTurnoIds((prev) => (prev.includes(turnoId) ? prev.filter((id) => id !== turnoId) : [...prev, turnoId]));
  }

  async function handleConfirmar(): Promise<void> {
    if (!datos) return;
    const result = await onSubmit({ ...datos, turnoIds });
    if (result) {
      setResultado(result);
      setPaso('listo');
    }
    // Si falla, el error lo muestra el padre vía serverError y se queda en el paso 2.
  }

  if (paso === 'listo' && resultado) {
    return (
      <div className="rounded-xl border border-emerald-900/60 bg-zinc-900 p-6">
        <h2 className="text-base font-semibold text-emerald-200">Socio dado de alta</h2>
        <p className="mt-1 text-sm text-zinc-300">
          {resultado.socio.nombre} ya puede ingresar a la app con:
        </p>
        <dl className="mt-4 grid grid-cols-1 gap-2 rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Usuario</dt>
            <dd className="font-mono font-semibold text-zinc-100">{resultado.usuario.username}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Clave inicial</dt>
            <dd className="font-mono font-semibold text-zinc-100">{resultado.socio.dni}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-zinc-400">
          La clave inicial es el DNI: deberá cambiarla cuando exista el panel de alumno.
          {resultado.reservas.length > 0
            ? ` Se le asignaron ${resultado.reservas.length} turno${resultado.reservas.length === 1 ? '' : 's'}.`
            : ' Sin turnos asignados (podrás hacerlo en Horarios).'}
        </p>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-900 transition-colors hover:bg-white"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <ol className="flex items-center gap-2 text-xs font-medium" aria-label="Pasos del alta">
        <li className={paso === 'datos' ? 'text-zinc-100' : 'text-zinc-500'}>1 · Datos</li>
        <li aria-hidden className="text-zinc-600">→</li>
        <li className={paso === 'horarios' ? 'text-zinc-100' : 'text-zinc-500'}>2 · Horarios</li>
      </ol>

      {paso === 'datos' ? (
        <div className="mt-4">
          <SocioForm
            initialSocio={null}
            submitting={false}
            formError={null}
            onSubmit={handleDatos}
            onCancel={onCancel}
          />
        </div>
      ) : (
        <div className="mt-4">
          <h2 className="text-base font-semibold text-zinc-100">Horarios de {datos?.nombre}</h2>
          <p className="mt-1 text-xs text-zinc-400">
            Selecciona los turnos con lugar para asignarlos en el alta. Se crea el usuario de acceso (usuario = DNI) en la misma operación.
          </p>
          <div className="mt-4">
            {loadingTurnos ? (
              <p className="text-sm text-zinc-400">Cargando horarios libres…</p>
            ) : turnosError ? (
              <p role="alert" className="rounded-lg border border-red-900/60 bg-red-950/50 px-3 py-2 text-sm text-red-200">
                {turnosError} Puedes omitir este paso y asignar horarios luego.
              </p>
            ) : (
              <SocioHorariosSelector
                turnos={turnos}
                selectedIds={turnoIds}
                diasSugeridos={datos?.diasEntrenamiento ?? null}
                onToggle={toggleTurno}
              />
            )}
          </div>

          {serverError ? (
            <p role="alert" className="mt-3 rounded-lg border border-red-900/60 bg-red-950/50 px-3 py-2 text-sm text-red-200">
              {serverError}
            </p>
          ) : null}

          <div className="mt-5 flex justify-between gap-2">
            <button
              type="button"
              onClick={() => { setPaso('datos'); onClearServerError(); }}
              disabled={submitting}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700 disabled:opacity-50"
            >
              ← Volver a datos
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void handleConfirmar()}
                disabled={submitting || loadingTurnos}
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700 disabled:opacity-50"
              >
                {submitting ? 'Guardando…' : turnoIds.length === 0 ? 'Omitir y dar de alta' : 'Dar de alta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
