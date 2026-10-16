import { useMemo } from 'react';
import type { DiaSemana, ITurnoConOcupacion } from '@gym/shared';

interface SocioHorariosSelectorProps {
  turnos: ITurnoConOcupacion[];
  selectedIds: string[];
  diasSugeridos: number | null;
  onToggle: (turnoId: string) => void;
}

/** Columnas fijas de la grilla semanal (el gym no opera sábados ni domingos). */
const DIAS_COLUMNAS: DiaSemana[] = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES'];

/**
 * Selector de horarios libres para el alta de un socio.
 * Solo permite elegir turnos con cupo (`ocupados < cupoMax`); los llenos
 * se muestran deshabilitados. `diasSugeridos` es informativo: no bloquea.
 * No hace HTTP: recibe los turnos ya cargados por el wizard.
 */
export function SocioHorariosSelector({ turnos, selectedIds, diasSugeridos, onToggle }: SocioHorariosSelectorProps) {
  const seleccionados = useMemo(() => new Set(selectedIds), [selectedIds]);

  const turnosPorDia = useMemo(() => {
    const agrupados = {} as Record<DiaSemana, ITurnoConOcupacion[]>;
    for (const dia of DIAS_COLUMNAS) agrupados[dia] = [];
    for (const turno of turnos) {
      if (agrupados[turno.dia]) agrupados[turno.dia].push(turno);
    }
    for (const dia of DIAS_COLUMNAS) agrupados[dia].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
    return agrupados;
  }, [turnos]);

  const libres = useMemo(() => turnos.filter((t) => t.ocupados < t.cupoMax).length, [turnos]);

  if (turnos.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-700 px-4 py-6 text-center">
        <p className="text-sm text-zinc-400">No hay turnos creados. Puedes omitir este paso y asignar horarios luego en la página de Horarios.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-zinc-400">
        {libres} turno{libres === 1 ? '' : 's'} con lugar disponible
        {diasSugeridos !== null ? ` · el socio planea ${diasSugeridos} día${diasSugeridos === 1 ? '' : 's'} por semana (sugerencia, no bloquea)` : null}
        {' · '}seleccionados: {selectedIds.length}
      </p>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {DIAS_COLUMNAS.map((dia) => {
          const delDia = turnosPorDia[dia];
          return (
            <section key={dia} aria-label={`Turnos libres del ${dia}`} className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/40 p-2">
              <h3 className="px-1 pb-2 pt-1 text-xs font-bold uppercase tracking-wide text-zinc-300">{dia}</h3>
              <div className="flex flex-1 flex-col gap-2">
                {delDia.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-zinc-800 px-2 py-3 text-center text-[11px] text-zinc-500">Sin turnos</p>
                ) : (
                  delDia.map((turno) => {
                    const libre = turno.ocupados < turno.cupoMax;
                    const activo = seleccionados.has(turno.id);
                    return (
                      <button
                        key={turno.id}
                        type="button"
                        disabled={!libre}
                        onClick={() => onToggle(turno.id)}
                        aria-pressed={activo}
                        className={`rounded-lg border px-2 py-2 text-left text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                          activo
                            ? 'border-emerald-600 bg-emerald-950/60 text-emerald-100'
                            : 'border-zinc-700 bg-zinc-950 text-zinc-200 hover:border-zinc-500'
                        }`}
                      >
                        <span className="font-semibold">{turno.horaInicio}</span>
                        <span className="ml-2 text-[11px] text-zinc-400">
                          {libre ? `${turno.cupoMax - turno.ocupados} libre${turno.cupoMax - turno.ocupados === 1 ? '' : 's'}` : 'Lleno'}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
