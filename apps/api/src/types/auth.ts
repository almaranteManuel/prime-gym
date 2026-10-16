import type { RolUsuario } from '@gym/shared';

export interface AuthenticatedUser {
  id: string;
  username: string;
  rol: RolUsuario;
  socioId: string | null;
}

export interface JwtClaims {
  sub: string;
  username: string;
  rol: RolUsuario;
  socioId: string | null;
}
