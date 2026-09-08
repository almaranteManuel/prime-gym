import type { ISocio } from '@gym/shared';

interface SociosTableProps {
  socios: ISocio[];
  onEdit: (socio: ISocio) => void;
  onDelete: (socio: ISocio) => void;
  onPay: (socio: ISocio) => void;
  onRutinas: (socio: ISocio) => void;
  emptyMessage?: string;
}

/**
 * Tabla presentacional de socios (solo UI, sin fetching).
 * Esquema estrictamente oscuro: zinc-900/950, texto de alto contraste.
 * Los inactivos solo ofrecen "Registrar pago" (reactiva + otorga membresía);
 * la edición y la baja aplican a activos.
 */
export function SociosTable({ socios, onEdit, onDelete, onPay, onRutinas, emptyMessage }: SociosTableProps) {
  if (!Array.isArray(socios)) {
    return (
      <div className="rounded-xl border border-red-900/60 bg-red-950/50 p-8 text-center">
        <p className="text-sm text-red-200">Respuesta inesperada de la API: se esperaba una lista de socios.</p>
      </div>
    );
  }

  if (socios.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
        <p className="text-sm text-zinc-400">{emptyMessage ?? 'No hay socios para mostrar.'}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900">
      <table className="min-w-full divide-y divide-zinc-800 text-sm">
        <thead className="bg-zinc-950/60">
          <tr>
            <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-zinc-400">Nombre</th>
            <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-zinc-400">DNI</th>
            <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-zinc-400">Celular</th>
            <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-zinc-400">Alta</th>
            <th className="px-4 py-3 text-right font-semibold uppercase tracking-wide text-zinc-400">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {socios.map((socio) => (
            <tr key={socio.id} className="transition-colors hover:bg-zinc-800/50">
              <td className="px-4 py-3">
                <p className="font-medium text-zinc-100">{socio.nombre}</p>
                {socio.objetivos ? <p className="mt-0.5 max-w-64 truncate text-xs text-zinc-400">{socio.objetivos}</p> : null}
              </td>
              <td className="px-4 py-3 font-mono text-zinc-200">{socio.dni}</td>
              <td className="px-4 py-3 text-zinc-200">{socio.celular}</td>
              <td className="px-4 py-3 text-zinc-400">{socio.fechaAlta}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onPay(socio)}
                    title="Registrar pago"
                    className="rounded-lg border border-emerald-900/60 bg-emerald-950/60 px-3 py-1.5 text-xs font-medium text-emerald-200 transition-colors hover:border-emerald-800 hover:bg-emerald-900/60"
                  >
                    $ Pago
                  </button>
                  {socio.activo ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onRutinas(socio)}
                        title="Rutinas personalizadas"
                        className="rounded-lg border border-sky-900/60 bg-sky-950/60 px-3 py-1.5 text-xs font-medium text-sky-200 transition-colors hover:border-sky-800 hover:bg-sky-900/60"
                      >
                        Rutinas
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(socio)}
                        className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-100 transition-colors hover:border-zinc-600 hover:bg-zinc-700"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(socio)}
                        className="rounded-lg border border-red-900/60 bg-red-950/60 px-3 py-1.5 text-xs font-medium text-red-200 transition-colors hover:border-red-800 hover:bg-red-900/60"
                      >
                        Baja
                      </button>
                    </>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
