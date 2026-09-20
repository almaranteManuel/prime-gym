import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT ?? 3001),
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  jwtSecret: process.env.JWT_SECRET ?? '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '2h',
  defaultAdminUsername: process.env.DEFAULT_ADMIN_USERNAME ?? 'misael',
  defaultAdminPassword: process.env.DEFAULT_ADMIN_PASSWORD ?? (process.env.NODE_ENV === 'production' ? '' : '123456'),
} as const;

if (!env.jwtSecret) {
  throw new Error('JWT_SECRET es obligatorio para iniciar la API');
}
