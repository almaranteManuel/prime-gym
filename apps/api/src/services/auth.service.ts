import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import type { AuthResponse, LoginDTO } from '@gym/shared';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import type { AuthenticatedUser, JwtClaims } from '../types/auth.js';
import { HttpError } from '../utils/http-error.js';

const BCRYPT_ROUNDS = 12;

function normalizeCredentials(input: unknown): LoginDTO {
  if (input === null || typeof input !== 'object') {
    throw new HttpError(400, 'Credenciales inválidas', 'VALIDATION_ERROR');
  }
  const { username, password } = input as Record<string, unknown>;
  if (
    typeof username !== 'string' ||
    username.trim().length < 3 ||
    username.trim().length > 50 ||
    typeof password !== 'string' ||
    password.length < 6 ||
    password.length > 200
  ) {
    throw new HttpError(400, 'Usuario o contraseña inválidos', 'VALIDATION_ERROR');
  }
  return { username: username.trim().toLowerCase(), password };
}

function toAuthUser(user: { id: string; username: string; rol: 'ADMIN' | 'ALUMNO' }): AuthenticatedUser {
  return { id: user.id, username: user.username, rol: user.rol === 'ADMIN' ? 'admin' : 'alumno' };
}

function createToken(user: AuthenticatedUser): string {
  const claims: JwtClaims = { sub: user.id, username: user.username, rol: user.rol };
  const options: SignOptions = { expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'] };
  return jwt.sign(claims, env.jwtSecret, options);
}

export async function registerUser(input: unknown): Promise<AuthResponse> {
  const credentials = normalizeCredentials(input);
  const passwordHash = await bcrypt.hash(credentials.password, BCRYPT_ROUNDS);
  try {
    const user = await prisma.usuario.create({
      data: { username: credentials.username, passwordHash, rol: 'ALUMNO' },
    });
    const authUser = toAuthUser(user);
    return { token: createToken(authUser), user: authUser };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new HttpError(409, 'El nombre de usuario ya existe', 'USERNAME_EXISTS');
    }
    throw error;
  }
}

export async function loginUser(input: unknown): Promise<AuthResponse> {
  const credentials = normalizeCredentials(input);
  const user = await prisma.usuario.findUnique({ where: { username: credentials.username } });
  if (!user || !(await bcrypt.compare(credentials.password, user.passwordHash))) {
    throw new HttpError(401, 'Usuario o contraseña incorrectos', 'INVALID_CREDENTIALS');
  }
  const authUser = toAuthUser(user);
  return { token: createToken(authUser), user: authUser };
}

export async function ensureDefaultAdmin(): Promise<void> {
  if (!env.defaultAdminPassword) {
    throw new Error('DEFAULT_ADMIN_PASSWORD es obligatorio para crear el admin inicial');
  }
  const passwordHash = await bcrypt.hash(env.defaultAdminPassword, BCRYPT_ROUNDS);
  try {
    await prisma.usuario.create({
      data: { username: env.defaultAdminUsername, passwordHash, rol: 'ADMIN' },
    });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')) throw error;
  }
}
