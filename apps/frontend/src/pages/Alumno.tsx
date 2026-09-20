import type { AuthUser } from '@gym/shared';
import { clearAuthToken } from '../services/auth-storage.js';

export function Alumno({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  function logout(): void {
    clearAuthToken();
    onLogout();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-zinc-100">
      <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
        <h1 className="text-2xl font-bold">Hola, {user.username}</h1>
        <p className="mt-2 text-sm text-zinc-400">Panel de alumno disponible próximamente.</p>
        <button type="button" onClick={logout} className="mt-6 rounded-lg border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-800">
          Cerrar sesión
        </button>
      </section>
    </main>
  );
}
