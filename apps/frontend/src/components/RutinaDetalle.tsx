import { useRef, useState } from 'react';
import html2pdf from 'html2pdf.js';
import type { IRutina } from '@gym/shared';
import { RutinaPdf } from './RutinaPdf.js';

function slug(texto: string): string {
  return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'rutina';
}

/**
 * Detalle de rutina en dark-mode + exportación a PDF claro e imprimible.
 * El nodo para el PDF vive fuera de pantalla (fondo blanco solo allí).
 */
export function RutinaDetalle({ rutina }: { rutina: IRutina }) {
  const pdfRef = useRef<HTMLDivElement>(null);
  const [exportando, setExportando] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  async function handleDescargarPdf(): Promise<void> {
    const nodo = pdfRef.current;
    if (!nodo) {
      setPdfError('No se pudo preparar el documento.');
      return;
    }
    setExportando(true);
    setPdfError(null);
    try {
      const nombre = `rutina-${rutina.socio.dni}-${slug(rutina.titulo)}.pdf`;
      await html2pdf()
        .set({ margin: 10, filename: nombre, image: { type: 'jpeg', quality: 0.95 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } })
        .from(nodo)
        .save();
    } catch (err: unknown) {
      setPdfError(err instanceof Error && err.message ? err.message : 'No se pudo generar el PDF.');
    } finally {
      setExportando(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-zinc-100">{rutina.titulo}</h3>
          <p className="mt-0.5 text-xs text-zinc-400">
            {rutina.socio.nombre} · {new Date(rutina.fechaCreacion).toLocaleDateString('es-AR')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleDescargarPdf()}
          disabled={exportando}
          className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-300 disabled:opacity-50"
        >
          {exportando ? 'Generando…' : 'Descargar PDF'}
        </button>
      </div>

      {pdfError ? (
        <p role="alert" className="mt-3 rounded-lg border border-red-900/60 bg-red-950/50 px-3 py-2 text-sm text-red-200">
          {pdfError}
        </p>
      ) : null}

      <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900">
        <table className="min-w-full divide-y divide-zinc-800 text-sm">
          <thead className="bg-zinc-950/60">
            <tr>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-zinc-400">#</th>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-zinc-400">Ejercicio</th>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-zinc-400">Series</th>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-zinc-400">Reps</th>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-zinc-400">Notas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {rutina.ejercicios.map((e, i) => (
              <tr key={i} className="hover:bg-zinc-800/50">
                <td className="px-4 py-3 text-zinc-500">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-zinc-100">{e.ejercicio}</td>
                <td className="px-4 py-3 text-zinc-200">{e.series || '-'}</td>
                <td className="px-4 py-3 text-zinc-200">{e.repeticiones || '-'}</td>
                <td className="px-4 py-3 text-zinc-400">{e.notas || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Nodo imprimible fuera de pantalla: solo lo ve html2pdf. */}
      <div aria-hidden="true" style={{ position: 'fixed', left: -10000, top: 0 }}>
        <div ref={pdfRef}>
          <RutinaPdf rutina={rutina} />
        </div>
      </div>
    </div>
  );
}
