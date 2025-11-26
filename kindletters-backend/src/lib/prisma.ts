import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Prisma 7: For standard PostgreSQL connections, we can use the connection string directly
// The DATABASE_URL is automatically read from environment variables
// No adapter needed for standard Supabase PostgreSQL connections
// Supabase's session pooler handles connection pooling automatically
export const prisma = globalForPrisma.prisma || new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
