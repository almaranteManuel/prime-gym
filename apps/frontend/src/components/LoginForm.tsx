import { useState } from 'react';
import type { AuthUser } from '@gym/shared';
import { login } from '../services/auth.service.js';

interface LoginFormProps {
  onAuthenticated: (user: AuthUser) => void;
}

export function LoginForm({ onAuthenticated }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      onAuthenticated(await login({ username, password }));
    } catch {
      setError('Usuario o contraseña incorrectos.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-zinc-100">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <img src="/logo-prime-transparent.webp" alt="Prime Gym" className="mx-auto h-20 w-auto object-contain" />
        <h1 className="sr-only">Prime Gym</h1>
        <p className="mt-3 text-center text-sm text-zinc-400">Ingresá a tu cuenta</p>
        {error ? <p role="alert" className="mt-4 rounded-lg bg-red-950 px-3 py-2 text-sm text-red-200">{error}</p> : null}
        <label className="mt-5 block text-sm text-zinc-300">
          Usuario
          <input required minLength={3} maxLength={50} value={username} onChange={(event) => setUsername(event.target.value)} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100" autoComplete="username" />
        </label>
        <label className="mt-4 block text-sm text-zinc-300">
          Contraseña
          <input required minLength={6} maxLength={200} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100" autoComplete="current-password" />
        </label>
        <button type="submit" disabled={loading} className="mt-6 w-full rounded-lg bg-emerald-400 px-4 py-2 font-semibold text-zinc-950 disabled:opacity-50">
          {loading ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </main>
  );
}
