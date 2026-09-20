import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { RolUsuario } from '@gym/shared';
import { env } from '../config/env.js';
import { HttpError } from '../utils/http-error.js';
import type { JwtClaims } from '../types/auth.js';

function isJwtClaims(value: unknown): value is JwtClaims {
  if (value === null || typeof value !== 'object') return false;
  const claims = value as Record<string, unknown>;
  return (
    typeof claims.sub === 'string' &&
    typeof claims.username === 'string' &&
    (claims.rol === 'admin' || claims.rol === 'alumno')
  );
}

export function verificarToken(req: Request, _res: Response, next: NextFunction): void {
  const authorization = req.header('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    next(new HttpError(401, 'Token requerido', 'AUTH_REQUIRED'));
    return;
  }
  const token = authorization.slice('Bearer '.length).trim();
  if (!token) {
    next(new HttpError(401, 'Token requerido', 'AUTH_REQUIRED'));
    return;
  }
  try {
    const decoded: unknown = jwt.verify(token, env.jwtSecret);
    if (!isJwtClaims(decoded)) throw new HttpError(401, 'Token inválido', 'INVALID_TOKEN');
    req.user = { id: decoded.sub, username: decoded.username, rol: decoded.rol };
    next();
  } catch (error) {
    next(error instanceof HttpError ? error : new HttpError(401, 'Token inválido o expirado', 'INVALID_TOKEN'));
  }
}

export function checkRole(roles: RolUsuario[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.rol)) {
      next(new HttpError(403, 'No tiene permisos para esta operación', 'FORBIDDEN'));
      return;
    }
    next();
  };
}
