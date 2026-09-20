export type SectionId = 'dashboard' | 'socios' | 'horarios';

interface SidebarProps {
  active: SectionId;
  onSelect: (section: SectionId) => void;
  onLogout?: () => void;
}

const ITEMS: ReadonlyArray<{ id: SectionId; label: string; hint: string }> = [
  { id: 'dashboard', label: 'Panel del día', hint: 'Turnos y asistencia de hoy' },
  { id: 'socios', label: 'Socios', hint: 'AMB, pagos y membresías' },
  { id: 'horarios', label: 'Horarios', hint: 'Turnos y alumnos' },
];

/**
 * Barra lateral de secciones (presentacional, sin routing).
 * Pensada para crecer: agregar una entrada a ITEMS suma una sección.
 */
export function Sidebar({ active, onSelect, onLogout }: SidebarProps) {
  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col gap-1 border-r border-zinc-800 bg-zinc-950 p-4">
      <div className="px-2 pb-4 pt-2">
        <p className="text-base font-bold tracking-tight text-zinc-100">Prime Gym</p>
        <p className="mt-0.5 text-xs text-zinc-500">Gestión del gimnasio</p>
      </div>
      <nav aria-label="Secciones" className="flex flex-col gap-1">
        {ITEMS.map((item) => {
          const selected = item.id === active;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              aria-current={selected ? 'page' : undefined}
              className={`rounded-lg px-3 py-2.5 text-left transition-colors ${
                selected
                  ? 'bg-zinc-100 text-zinc-900'
                  : 'text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100'
              }`}
            >
              <span className="block text-sm font-semibold">{item.label}</span>
              <span className={`block text-xs ${selected ? 'text-zinc-600' : 'text-zinc-500'}`}>{item.hint}</span>
            </button>
          );
        })}
      </nav>
      {onLogout ? (
        <button type="button" onClick={onLogout} className="mt-auto rounded-lg px-3 py-2 text-left text-sm text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200">
          Cerrar sesión
        </button>
      ) : null}
    </aside>
  );
}
