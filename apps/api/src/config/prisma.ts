import { PrismaClient } from '@prisma/client';

// Singleton: evita múltiples instancias en dev con hot-reload (tsx watch).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
