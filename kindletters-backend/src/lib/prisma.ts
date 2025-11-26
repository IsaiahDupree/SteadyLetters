import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Prisma 7: Requires adapter or accelerateUrl
// Using @prisma/adapter-pg with Supabase's session pooler
function createPrismaClient() {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
        throw new Error('DATABASE_URL environment variable is not set');
    }

    // Create PostgreSQL connection pool for Supabase
    // Supabase's session pooler (port 5432) handles connection pooling
    const pool = new Pool({ 
        connectionString,
        // Serverless-friendly settings
        max: 1, // Limit connections per serverless function
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    });
    
    // Create Prisma adapter
    const adapter = new PrismaPg(pool);
    
    // Create Prisma Client with adapter
    return new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
