import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Prisma 7: DATABASE_URL is read from environment automatically
// The prisma.config.ts file handles the connection URL for migrations
// In serverless environments, we need to ensure Prisma Client is properly initialized
export const prisma = globalForPrisma.prisma || new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
