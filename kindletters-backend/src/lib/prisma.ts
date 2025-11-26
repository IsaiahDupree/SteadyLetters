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

// Simple lazy initialization - create on first access
// Since dotenv.config() runs in index.ts before routes are imported,
// DATABASE_URL will be available when Prisma is first used
let prismaInstance: PrismaClient | null = null;

function getPrismaClient(): PrismaClient {
    // Use global instance if available (for hot reload in development)
    if (globalForPrisma.prisma) {
        return globalForPrisma.prisma;
    }
    
    // Create new instance if needed
    if (!prismaInstance) {
        prismaInstance = createPrismaClient();
    }
    
    return prismaInstance;
}

// Export getter function - routes will access prisma properties which triggers initialization
// This is simpler than Proxy and avoids recursion issues
export const prisma = (() => {
    const client = getPrismaClient();
    return client;
})();

// Store in global for hot reload in development
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
