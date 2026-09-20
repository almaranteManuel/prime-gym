import type { RolUsuario } from '@gym/shared';

export interface AuthenticatedUser {
  id: string;
  username: string;
  rol: RolUsuario;
}

export interface JwtClaims {
  sub: string;
  username: string;
  rol: RolUsuario;
}
