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

// Truly lazy initialization - only create when first property is accessed
// This is critical for serverless where env vars may not be available at module load
let prismaInstance: PrismaClient | null = null;

function getPrismaClient(): PrismaClient {
    // Use global instance if available (for hot reload in development)
    if (globalForPrisma.prisma && !prismaInstance) {
        prismaInstance = globalForPrisma.prisma;
        return prismaInstance;
    }
    
    // Create new instance if needed
    if (!prismaInstance) {
        prismaInstance = createPrismaClient();
    }
    
    return prismaInstance;
}

// Use Object.defineProperty to create a lazy getter
// This ensures Prisma is only initialized when actually accessed, not at module load
const prismaDescriptor: PropertyDescriptor = {
    get() {
        return getPrismaClient();
    },
    enumerable: true,
    configurable: true,
};

// Create a dummy object and define prisma as a getter property
const prismaModule = {};
Object.defineProperty(prismaModule, 'prisma', prismaDescriptor);

// Export the getter - this will only initialize Prisma when first accessed
export const prisma = (prismaModule as any).prisma as PrismaClient;

// Store in global for hot reload in development
if (process.env.NODE_ENV !== 'production') {
    Object.defineProperty(globalForPrisma, 'prisma', {
        get() {
            return getPrismaClient();
        },
        configurable: true,
    });
}
