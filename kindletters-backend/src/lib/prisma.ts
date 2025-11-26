import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Prisma 7: Must provide adapter or accelerateUrl
// For standard PostgreSQL, we use the pg adapter
function createPrismaClient() {
    try {
        const connectionString = process.env.DATABASE_URL;
        
        if (!connectionString) {
            console.error('ERROR: DATABASE_URL environment variable is not set');
            throw new Error('DATABASE_URL environment variable is not set');
        }

        // Create PostgreSQL connection pool
        const pool = new Pool({ 
            connectionString,
            // Connection pool settings for serverless
            max: 1, // Limit connections in serverless
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });
        
        // Create Prisma adapter
        const adapter = new PrismaPg(pool);
        
        // Create Prisma Client with adapter
        const client = new PrismaClient({
            adapter,
            log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        });
        
        console.log('✅ Prisma Client initialized with PostgreSQL adapter');
        return client;
    } catch (error) {
        console.error('❌ Failed to create Prisma Client:', error);
        throw error;
    }
}

// Lazy initialization - only create when first accessed
let prismaInstance: PrismaClient | null = null;

export const prisma = globalForPrisma.prisma || (() => {
    if (!prismaInstance) {
        prismaInstance = createPrismaClient();
    }
    return prismaInstance;
})();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
