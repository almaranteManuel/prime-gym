import { useMemo, useState } from 'react';
import { useDashboard } from '../hooks/useDashboard.js';
import { useResumen } from '../hooks/useResumen.js';
import { DashboardTurnoCard } from '../components/DashboardTurnoCard.js';

/** Fecha "YYYY-MM-DD" → texto legible en la zona del gimnasio. */
function formatoFechaLarga(fecha: string): string {
  const texto = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(`${fecha}T12:00:00.000Z`));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Mes vigente "YYYY-MM" en la zona del gimnasio (default del filtro). */
function mesActualBA(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
  }).format(new Date());
}

/** "YYYY-MM-DD" → "DD/MM". */
function formatoCorto(fecha: string): string {
  const [y, m, d] = fecha.split('-');
  return `${d}/${m}/${y?.slice(2) ?? ''}`;
}

const formatoMoneda = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

const cardClass = 'rounded-xl border border-zinc-800 bg-zinc-900 p-5';

/**
 * Panel del día (vista inicial): resumen operativo (socios, ocupación,
 * cobrado del mes, cobranza) + horarios de hoy colapsables.
 */
export function Dashboard() {
  const { dashboard, loading, error, refresh, unassign } = useDashboard();
  const [mes, setMes] = useState<string>(() => mesActualBA());
  const { resumen, loading: loadingResumen, error: errorResumen, refresh: refreshResumen } = useResumen(mes);
  const [armingId, setArmingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const ocupacion = useMemo(() => {
    const turnos = dashboard?.turnos ?? [];
    const ocupados = turnos.reduce((acc, t) => acc + t.ocupados, 0);
    const capacidad = turnos.reduce((acc, t) => acc + t.cupoMax, 0);
    return { ocupados, capacidad, ratio: capacidad > 0 ? ocupados / capacidad : 0 };
  }, [dashboard]);

  const cobranzaVencida = useMemo(
    () => (resumen?.cobranza ?? []).filter((c) => c.estado === 'vencida'),
    [resumen],
  );
  const cobranzaPorVencer = useMemo(
    () => (resumen?.cobranza ?? []).filter((c) => c.estado === 'porVencer'),
    [resumen],
  );

  async function handleConfirm(reservaId: string): Promise<void> {
    setBusyId(reservaId);
    try {
      const ok = await unassign(reservaId);
      if (ok) setArmingId(null);
    } finally {
      setBusyId(null);
    }
  }

  function handleRefresh(): void {
    void refresh();
    void refreshResumen();
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Inicio</h1>
            <p className="mt-1 text-sm text-zinc-400">
              {dashboard ? formatoFechaLarga(dashboard.fecha) : 'Hoy'} 
            </p>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || loadingResumen}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading || loadingResumen ? 'Cargando…' : 'Recargar'}
          </button>
        </header>

        {error ? (
          <p role="alert" className="mt-4 rounded-xl border border-red-900/60 bg-red-950/50 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        {/* Resumen operativo */}
        <section aria-label="Resumen" className="mt-6">
          {errorResumen ? (
            <p role="alert" className="rounded-xl border border-red-900/60 bg-red-950/50 px-4 py-3 text-sm text-red-200">
              {errorResumen}
            </p>
          ) : loadingResumen || !resumen ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
              <p className="text-sm text-zinc-400">Cargando resumen…</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className={cardClass}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Socios</p>
                  <p className="mt-2 text-3xl font-bold text-zinc-100">
                    {resumen.sociosActivos}
                    <span className="ml-1 text-base font-medium text-zinc-500">/ {resumen.sociosTotal}</span>
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">activos / totales</p>
                </div>
                <div className={cardClass}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Ocupación hoy</p>
                  <p className="mt-2 text-3xl font-bold text-zinc-100">
                    {ocupacion.ocupados}
                    <span className="ml-1 text-base font-medium text-zinc-500">/ {ocupacion.capacidad}</span>
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800" role="progressbar" aria-valuenow={ocupacion.ocupados} aria-valuemin={0} aria-valuemax={ocupacion.capacidad}>
                    <div
                      className="h-full rounded-full bg-emerald-400 transition-all"
                      style={{ width: `${Math.min(100, ocupacion.ratio * 100)}%` }}
                    />
                  </div>
                </div>
                <div className={cardClass}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Cobrado en el mes</p>
                    <input
                      type="month"
                      aria-label="Mes del resumen de pagos"
                      value={mes}
                      onChange={(e) => { if (e.target.value) setMes(e.target.value); }}
                      className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-200 outline-none focus:border-zinc-500"
                    />
                  </div>
                  <p className="mt-2 text-3xl font-bold text-zinc-100">{formatoMoneda.format(resumen.pagosMes.total)}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {resumen.pagosMes.cantidad} pagos · Efvo. {formatoMoneda.format(resumen.pagosMes.porMetodo.EFECTIVO.total)} · Transf. {formatoMoneda.format(resumen.pagosMes.porMetodo.TRANSFERENCIA.total)}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">Cobranza</h2>
                {resumen.cobranza.length === 0 ? (
                  <p className="mt-2 text-sm text-zinc-500">Sin vencidas ni vencimientos en los próximos 7 días.</p>
                ) : (
                  <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-red-300">
                        Vencidas · {cobranzaVencida.length}
                      </h3>
                      {cobranzaVencida.length === 0 ? (
                        <p className="mt-2 text-xs text-zinc-500">Ninguna.</p>
                      ) : (
                        <ul className="mt-2 flex flex-col gap-1.5">
                          {cobranzaVencida.map((c) => (
                            <li key={c.socioId} className="flex items-center justify-between gap-2 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-1.5 text-xs">
                              <span className="min-w-0">
                                <span className="block truncate font-medium text-zinc-100">{c.nombre}</span>
                                <span className="font-mono text-zinc-500">{c.dni}</span>
                              </span>
                              <span className="shrink-0 font-mono text-red-200">venció {formatoCorto(c.fechaFin)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-300">
                        Por vencer (7 días) · {cobranzaPorVencer.length}
                      </h3>
                      {cobranzaPorVencer.length === 0 ? (
                        <p className="mt-2 text-xs text-zinc-500">Ninguna.</p>
                      ) : (
                        <ul className="mt-2 flex flex-col gap-1.5">
                          {cobranzaPorVencer.map((c) => (
                            <li key={c.socioId} className="flex items-center justify-between gap-2 rounded-lg border border-amber-900/50 bg-amber-950/20 px-3 py-1.5 text-xs">
                              <span className="min-w-0">
                                <span className="block truncate font-medium text-zinc-100">{c.nombre}</span>
                                <span className="font-mono text-zinc-500">{c.dni}</span>
                              </span>
                              <span className="shrink-0 font-mono text-amber-200">vence {formatoCorto(c.fechaFin)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </section>

        {/* Horarios de hoy */}
        <section aria-label="Horarios de hoy" className="mt-8">
          <h2 className="text-lg font-bold tracking-tight">Horarios de hoy</h2>
          <div className="mt-4">
            {loading && !dashboard ? (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
                <p className="text-sm text-zinc-400">Cargando el día…</p>
              </div>
            ) : !dashboard || dashboard.turnos.length === 0 ? (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
                <p className="text-sm text-zinc-400">
                  No hay turnos para hoy{dashboard ? ` (${dashboard.dia})` : ''}. Crealos en la sección Horarios.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {dashboard.turnos.map((turno) => (
                  <DashboardTurnoCard
                    key={turno.id}
                    turno={turno}
                    armingId={armingId}
                    busyId={busyId}
                    onArm={(id) => setArmingId(id)}
                    onDisarm={() => setArmingId(null)}
                    onConfirm={(id) => void handleConfirm(id)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
