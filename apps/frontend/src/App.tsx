import { useState } from 'react';
import { Sidebar, type SectionId } from './components/Sidebar.js';
import { Dashboard } from './pages/Dashboard.js';
import { Socios } from './pages/Socios.js';
import { Horarios } from './pages/Horarios.js';

/**
 * Shell con navegación lateral por secciones (sin router externo:
 * el estado local alcanza para el mostrador y evita una dependencia).
 * El Panel del día es la vista inicial.
 */
export function App() {
  const [section, setSection] = useState<SectionId>('dashboard');

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      <Sidebar active={section} onSelect={setSection} />
      <main className="min-w-0 flex-1">
        {section === 'dashboard' ? <Dashboard /> : section === 'socios' ? <Socios /> : <Horarios />}
      </main>
    </div>
  );
}

export default App;
