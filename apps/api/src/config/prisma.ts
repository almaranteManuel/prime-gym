import { PrismaClient } from '@prisma/client';

// Singleton en globalThis: reutiliza la conexión en dev (hot-reload),
// en serverless (reutilización entre invocaciones tibias) y en producción.
// Sin esto cada invocación serverless abriría sockets nuevos hasta agotar
// el pool de Neon. Combinar con DATABASE_URL pooleada (pgbouncer).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

globalForPrisma.prisma = prisma;

export default prisma;
