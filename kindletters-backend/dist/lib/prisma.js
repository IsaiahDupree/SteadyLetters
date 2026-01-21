"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const pg_1 = require("pg");
const adapter_pg_1 = require("@prisma/adapter-pg");
const globalForPrisma = global;
// Prisma 7: Requires adapter or accelerateUrl
// Using @prisma/adapter-pg with Supabase's connection pooler
// Recommended: Transaction pooler (port 6543) for serverless
// Alternative: Session pooler (port 5432) for direct connections
function createPrismaClient() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error('DATABASE_URL environment variable is not set');
    }
    // Create PostgreSQL connection pool for Supabase
    // Works with both transaction pooler (6543) and session pooler (5432)
    const pool = new pg_1.Pool({
        connectionString,
        // Serverless-friendly settings
        max: 1, // Limit connections per serverless function
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    });
    // Create Prisma adapter
    const adapter = new adapter_pg_1.PrismaPg(pool);
    // Create Prisma Client with adapter
    return new client_1.PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
}
// Truly lazy initialization - only create when first property is accessed
// This is critical for serverless where env vars may not be available at module load
let prismaInstance = null;
function getPrismaClient() {
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
// Use a function-based export for truly lazy initialization
// This works correctly in both ES modules and CommonJS
// The function is only called when prisma is actually used, not at module load
let _prisma = null;
function getPrisma() {
    if (!_prisma) {
        _prisma = getPrismaClient();
    }
    return _prisma;
}
// Export as a getter property that works in both ESM and CommonJS
// This ensures Prisma is only initialized when actually accessed
exports.prisma = new Proxy({}, {
    get(_target, prop) {
        const client = getPrisma();
        const value = client[prop];
        // If it's a function, bind it to the client
        if (typeof value === 'function') {
            return value.bind(client);
        }
        return value;
    },
});
// Store in global for hot reload in development
if (process.env.NODE_ENV !== 'production') {
    Object.defineProperty(globalForPrisma, 'prisma', {
        get() {
            return getPrisma();
        },
        configurable: true,
    });
}
