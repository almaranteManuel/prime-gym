import type { AuthResponse, AuthTokenPayload, AuthUser, LoginDTO } from '@gym/shared';
import { api } from './api.js';
import { clearAuthToken, getAuthToken, setAuthToken } from './auth-storage.js';

export { clearAuthToken, getAuthToken };

function decodePayload(token: string): AuthTokenPayload | null {
  try {
    const encoded = token.split('.')[1];
    if (!encoded) return null;
    const payload = JSON.parse(
      atob(encoded.replace(/-/g, '+').replace(/_/g, '/')),
    ) as unknown;
    if (payload === null || typeof payload !== 'object') return null;
    const value = payload as Record<string, unknown>;
    if (
      typeof value.sub !== 'string' ||
      typeof value.username !== 'string' ||
      (value.rol !== 'admin' && value.rol !== 'alumno') ||
      typeof value.exp !== 'number' ||
      value.exp <= Math.floor(Date.now() / 1000)
    ) return null;
    return {
      sub: value.sub,
      username: value.username,
      rol: value.rol,
      iat: typeof value.iat === 'number' ? value.iat : 0,
      exp: value.exp,
    };
  } catch {
    return null;
  }
}

export function getCurrentUser(): AuthUser | null {
  const token = getAuthToken();
  const payload = token ? decodePayload(token) : null;
  if (!payload) {
    if (token) clearAuthToken();
    return null;
  }
  return { id: payload.sub, username: payload.username, rol: payload.rol };
}

export async function login(input: LoginDTO): Promise<AuthUser> {
  const response = await api.post<AuthResponse>('/auth/login', input);
  setAuthToken(response.data.token);
  return response.data.user;
}

export async function register(input: LoginDTO): Promise<AuthUser> {
  const response = await api.post<AuthResponse>('/auth/register', input);
  setAuthToken(response.data.token);
  return response.data.user;
}
