import { useMemo, useState } from 'react';
import type { CreatePagoDTO, ISocio, RegistrarPagoResult } from '@gym/shared';
import { useSocioHistorial } from '../hooks/useSocioHistorial.js';
import { SocioForm, type SocioFormValues } from '../components/SocioForm.js';
import { RegistrarPagoModal } from '../components/RegistrarPagoModal.js';

interface SocioPerfilProps {
  socio: ISocio;
  serverError: string | null;
  onBack: () => void;
  onUpdate: (id: string, values: SocioFormValues) => Promise<boolean>;
  onPay: (input: CreatePagoDTO) => Promise<RegistrarPagoResult | null>;
  onDeactivate: (socio: ISocio) => void;
  onRutinas: (socio: ISocio) => void;
  onClearServerError: () => void;
}

function toLocalDateOnly(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Perfil de un socio: datos editables, acciones (pago, rutinas, baja) e
 * historial de pagos y membresías. Vista local (sin router): el padre
 * provee el socio vivo de la lista y los handlers de mutación.
 */
export function SocioPerfil({
  socio,
  serverError,
  onBack,
  onUpdate,
  onPay,
  onDeactivate,
  onRutinas,
  onClearServerError,
}: SocioPerfilProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState<string | null>(null);

  const { pagos, membresias, loading, error, refresh } = useSocioHistorial(socio.id);

  const membresiaVigente = useMemo(() => {
    if (membresias.length === 0) return null;
    const hoy = toLocalDateOnly(new Date());
    const ultima = membresias[0];
    return ultima.fechaFin >= hoy ? ultima : null;
  }, [membresias]);

  const diasRestantes = useMemo(() => {
    if (!membresiaVigente) return null;
    const hoyUtc = Date.parse(`${toLocalDateOnly(new Date())}T00:00:00Z`);
    const finUtc = Date.parse(`${membresiaVigente.fechaFin}T00:00:00Z`);
    return Math.max(0, Math.round((finUtc - hoyUtc) / 86_400_000));
  }, [membresiaVigente]);

  async function handleUpdate(values: SocioFormValues): Promise<void> {
    setEditSubmitting(true);
    try {
      const ok = await onUpdate(socio.id, values);
      if (ok) setShowEdit(false);
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handlePay(input: CreatePagoDTO): Promise<RegistrarPagoResult | null> {
    setPaying(true);
    try {
      const result = await onPay(input);
      if (result) {
        setPayOpen(false);
        setPaySuccess(
          `Pago registrado. Membresía vigente hasta ${result.membresia.fechaFin}` +
            (result.socioReactivado ? ' · socio reactivado' : ''),
        );
        await refresh();
      }
      return result;
    } finally {
      setPaying(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => { onClearServerError(); onBack(); }}
        className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800"
      >
        ← Volver a socios
      </button>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{socio.nombre}</h1>
          <p className="mt-1 text-sm text-zinc-400">
            DNI <span className="font-mono text-zinc-300">{socio.dni}</span>
            {' · '}
            {socio.celular}
            {' · '}Alta {socio.fechaAlta}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              socio.activo
                ? 'border-emerald-900/60 bg-emerald-950/60 text-emerald-200'
                : 'border-zinc-700 bg-zinc-800 text-zinc-300'
            }`}
          >
            {socio.activo ? 'Activo' : 'Inactivo'}
          </span>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              membresiaVigente
                ? 'border-sky-900/60 bg-sky-950/60 text-sky-200'
                : 'border-zinc-700 bg-zinc-800 text-zinc-300'
            }`}
          >
            {membresiaVigente
              ? `Membresía hasta ${membresiaVigente.fechaFin}${diasRestantes !== null ? ` (${diasRestantes}d)` : ''}`
              : 'Sin membresía vigente'}
          </span>
          <span className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs font-semibold text-zinc-300">
            {socio.diasEntrenamiento !== null ? `${socio.diasEntrenamiento} días/sem` : 'Sin frecuencia'}
          </span>
        </div>
      </header>

      {serverError ? (
        <p role="alert" className="mt-4 rounded-xl border border-red-900/60 bg-red-950/50 px-4 py-3 text-sm text-red-200">
          {serverError}
        </p>
      ) : null}
      {paySuccess ? (
        <p role="status" className="mt-4 rounded-xl border border-emerald-900/60 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-200">
          {paySuccess}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-4 rounded-xl border border-red-900/60 bg-red-950/50 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => { setPayOpen(true); setPaySuccess(null); }}
          className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-300"
        >
          $ Registrar pago
        </button>
        {socio.activo ? (
          <button
            type="button"
            onClick={() => onRutinas(socio)}
            className="rounded-lg border border-sky-900/60 bg-sky-950/60 px-4 py-2 text-sm font-medium text-sky-200 transition-colors hover:border-sky-800 hover:bg-sky-900/60"
          >
            Rutinas
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => { setShowEdit((v) => !v); onClearServerError(); }}
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-100 transition-colors hover:border-zinc-600 hover:bg-zinc-700"
        >
          {showEdit ? 'Cerrar edición' : 'Editar datos'}
        </button>
      </div>

      {socio.objetivos || socio.patologias ? (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Objetivos</h2>
            <p className="mt-2 text-sm text-zinc-200">{socio.objetivos ?? '—'}</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Patologías</h2>
            <p className="mt-2 text-sm text-zinc-200">{socio.patologias ?? '—'}</p>
          </div>
        </div>
      ) : null}

      {showEdit ? (
        <div className="mt-6">
          <SocioForm
            initialSocio={socio}
            submitting={editSubmitting}
            formError={null}
            onSubmit={(values) => void handleUpdate(values)}
            onCancel={() => setShowEdit(false)}
          />
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section aria-label="Historial de pagos" className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="text-base font-semibold text-zinc-100">Historial de pagos</h2>
          <div className="mt-4">
            {loading ? (
              <p className="text-sm text-zinc-400">Cargando historial…</p>
            ) : pagos.length === 0 ? (
              <p className="text-sm text-zinc-400">Sin pagos registrados.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-800 text-sm">
                  <thead>
                    <tr>
                      <th className="py-2 pr-4 text-left font-semibold uppercase tracking-wide text-zinc-400">Fecha</th>
                      <th className="py-2 pr-4 text-right font-semibold uppercase tracking-wide text-zinc-400">Monto</th>
                      <th className="py-2 text-left font-semibold uppercase tracking-wide text-zinc-400">Método</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {pagos.map((p) => (
                      <tr key={p.id}>
                        <td className="py-2 pr-4 font-mono text-zinc-200">{p.fechaPago}</td>
                        <td className="py-2 pr-4 text-right font-mono text-zinc-100">${p.monto}</td>
                        <td className="py-2 text-zinc-300">{p.metodo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <section aria-label="Historial de membresías" className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="text-base font-semibold text-zinc-100">Membresías</h2>
          <div className="mt-4">
            {loading ? (
              <p className="text-sm text-zinc-400">Cargando historial…</p>
            ) : membresias.length === 0 ? (
              <p className="text-sm text-zinc-400">Sin membresías todavía.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-800 text-sm">
                  <thead>
                    <tr>
                      <th className="py-2 pr-4 text-left font-semibold uppercase tracking-wide text-zinc-400">Inicio</th>
                      <th className="py-2 pr-4 text-left font-semibold uppercase tracking-wide text-zinc-400">Fin</th>
                      <th className="py-2 text-left font-semibold uppercase tracking-wide text-zinc-400">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {membresias.map((m) => {
                      const vigente = m.id === membresiaVigente?.id;
                      return (
                        <tr key={m.id}>
                          <td className="py-2 pr-4 font-mono text-zinc-200">{m.fechaInicio}</td>
                          <td className="py-2 pr-4 font-mono text-zinc-200">{m.fechaFin}</td>
                          <td className="py-2">
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                                vigente
                                  ? 'border-emerald-900/60 bg-emerald-950/60 text-emerald-200'
                                  : 'border-zinc-700 bg-zinc-800 text-zinc-400'
                              }`}
                            >
                              {vigente ? 'Vigente' : 'Finalizada'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>

      <section aria-label="Baja del socio" className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        {socio.activo ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-zinc-100">Dar de baja</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Baja lógica: el socio pasará a Inactivos pero sus datos, pagos y membresías se conservan.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onDeactivate(socio)}
              className="rounded-lg border border-red-900/60 bg-red-950/60 px-4 py-2 text-sm font-medium text-red-200 transition-colors hover:border-red-800 hover:bg-red-900/60"
            >
              Dar de baja
            </button>
          </div>
        ) : (
          <div>
            <h2 className="text-base font-semibold text-zinc-100">Socio inactivo</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Para reactivarlo, registra un pago: le otorgará 1 mes de membresía y volverá a Activos.
            </p>
          </div>
        )}
      </section>

      {payOpen ? (
        <RegistrarPagoModal
          socio={socio}
          submitting={paying}
          onSubmit={handlePay}
          onClose={() => setPayOpen(false)}
        />
      ) : null}
    </div>
  );
}
