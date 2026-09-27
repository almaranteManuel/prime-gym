import { useMemo, useState } from 'react';
import type { CreatePagoDTO, ISocio, RegistrarPagoResult } from '@gym/shared';
import { useSocios } from '../hooks/useSocios.js';
import { SociosTable } from '../components/SociosTable.js';
import { SocioForm, type SocioFormValues } from '../components/SocioForm.js';
import { RegistrarPagoModal } from '../components/RegistrarPagoModal.js';
import { RutinasModal } from '../components/RutinasModal.js';
import { SocioPerfil } from './SocioPerfil.js';

type Tab = 'activos' | 'inactivos';

/**
 * Página de gestión de socios (AMB + listado + pagos + perfil).
 * Coordina el hook useSocios con los componentes presentacionales.
 * Las tabs filtran en cliente por `socio.activo`. El perfil es una
 * vista local (sin router) seleccionada por id.
 */
export function Socios() {
  const { socios, loading, error, refresh, create, update, remove, pay, clearError } = useSocios();
  const [tab, setTab] = useState<Tab>('activos');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<ISocio | null>(null);
  const [payTarget, setPayTarget] = useState<ISocio | null>(null);
  const [paying, setPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState<string | null>(null);
  const [rutinasTarget, setRutinasTarget] = useState<ISocio | null>(null);
  const [perfilSocioId, setPerfilSocioId] = useState<string | null>(null);

  const activos = useMemo(() => socios.filter((s) => s.activo), [socios]);
  const inactivos = useMemo(() => socios.filter((s) => !s.activo), [socios]);
  const visible = tab === 'activos' ? activos : inactivos;
  const perfilSocio = perfilSocioId ? (socios.find((s) => s.id === perfilSocioId) ?? null) : null;

  function openCreate(): void {
    setShowForm(true);
    clearError();
  }

  function closeForm(): void {
    setShowForm(false);
  }

  function openPay(socio: ISocio): void {
    setPayTarget(socio);
    setPaySuccess(null);
    clearError();
  }

  function closePay(): void {
    setPayTarget(null);
  }

  async function handleSubmit(values: SocioFormValues): Promise<void> {
    setSubmitting(true);
    try {
      const created = await create(values);
      if (created) closeForm();
    } finally {
      setSubmitting(false);
    }
  }

  /** Actualización desde el perfil: devuelve éxito para cerrar la edición. */
  async function handleUpdateFromPerfil(id: string, values: SocioFormValues): Promise<boolean> {
    const updated = await update(id, values);
    return updated !== null;
  }

  async function handleConfirmDelete(): Promise<void> {
    if (!confirmDelete) return;
    const ok = await remove(confirmDelete.id);
    if (ok) {
      setConfirmDelete(null);
      setPerfilSocioId(null);
      setTab('inactivos');
    }
  }

  async function handlePay(input: CreatePagoDTO): Promise<RegistrarPagoResult | null> {
    setPaying(true);
    try {
      const result = await pay(input);
      if (result) {
        setPaySuccess(
          `Pago registrado. Membresía vigente hasta ${result.membresia.fechaFin}` +
            (result.socioReactivado ? ' · socio reactivado' : ''),
        );
        setPayTarget(null);
        setTab('activos');
      }
      return result;
    } finally {
      setPaying(false);
    }
  }

  const tabClass = (id: Tab): string =>
    `rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
      tab === id
        ? 'bg-zinc-100 text-zinc-900'
        : 'border border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
    }`;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Socios</h1>
            <p className="mt-1 text-sm text-zinc-400">Alta, edición, baja lógica, pagos y membresías.</p>
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
              onClick={openCreate}
              className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-900 transition-colors hover:bg-white"
            >
              + Nuevo socio
            </button>
          </div>
        </header>

        {perfilSocio ? (
          <div className="mt-6">
            <SocioPerfil
              socio={perfilSocio}
              serverError={error}
              onBack={() => setPerfilSocioId(null)}
              onUpdate={handleUpdateFromPerfil}
              onPay={handlePay}
              onDeactivate={(s) => setConfirmDelete(s)}
              onRutinas={(s) => setRutinasTarget(s)}
              onClearServerError={clearError}
            />
          </div>
        ) : (
          <>
            {error ? (
              <p role="alert" className="mt-4 rounded-xl border border-red-900/60 bg-red-950/50 px-4 py-3 text-sm text-red-200">
                {error}
              </p>
            ) : null}
            {paySuccess ? (
              <p role="status" className="mt-4 rounded-xl border border-emerald-900/60 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-200">
                {paySuccess}
              </p>
            ) : null}

            <div className="mt-6 inline-flex gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-1.5" role="tablist" aria-label="Estado de socios">
              <button type="button" role="tab" aria-selected={tab === 'activos'} onClick={() => setTab('activos')} className={tabClass('activos')}>
                Activos · {activos.length}
              </button>
              <button type="button" role="tab" aria-selected={tab === 'inactivos'} onClick={() => setTab('inactivos')} className={tabClass('inactivos')}>
                Inactivos · {inactivos.length}
              </button>
            </div>

            {showForm ? (
              <div className="mt-6">
                <SocioForm
                  initialSocio={null}
                  submitting={submitting}
                  formError={null}
                  onSubmit={(values) => void handleSubmit(values)}
                  onCancel={closeForm}
                />
              </div>
            ) : null}

            <div className="mt-6">
              {loading && socios.length === 0 ? (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
                  <p className="text-sm text-zinc-400">Cargando socios…</p>
                </div>
              ) : (
                <SociosTable
                  socios={visible}
                  onPay={openPay}
                  onVerPerfil={(s) => { setPerfilSocioId(s.id); clearError(); setPaySuccess(null); }}
                  emptyMessage={tab === 'activos' ? 'No hay socios activos. Da de alta el primero.' : 'No hay socios inactivos.'}
                />
              )}
            </div>
          </>
        )}

        {payTarget ? (
          <RegistrarPagoModal socio={payTarget} submitting={paying} onSubmit={handlePay} onClose={closePay} />
        ) : null}

        {rutinasTarget ? (
          <RutinasModal socioInicial={rutinasTarget} sociosActivos={activos} onClose={() => setRutinasTarget(null)} />
        ) : null}

        {confirmDelete ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-6">
              <h2 className="text-base font-semibold">Dar de baja a {confirmDelete.nombre}</h2>
              <p className="mt-2 text-sm text-zinc-400">
                Se realizará una baja lógica: el socio pasará a la pestaña Inactivos pero sus datos se conservan.
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
                  Confirmar baja
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
