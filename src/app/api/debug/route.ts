import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

/**
 * Debug endpoint to check authentication and database status
 * Only available in development
 */
export async function GET(request: NextRequest) {
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
    }

    const debug: any = {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
    };

    try {
        // Check authentication
        const user = await getAuthenticatedUser(request);
        debug.auth = {
            authenticated: !!user,
            userId: user?.id || null,
            email: user?.email || null,
        };

        // Check database connection
        try {
            await prisma.$connect();
            debug.database = { connected: true };
        } catch (error: any) {
            debug.database = { 
                connected: false, 
                error: error.message 
            };
        }

        // Check if user exists in Prisma
        if (user) {
            try {
                const dbUser = await prisma.user.findUnique({
                    where: { id: user.id },
                });
                debug.userInPrisma = {
                    exists: !!dbUser,
                    hasUsage: false,
                };

                if (dbUser) {
                    const usage = await prisma.userUsage.findUnique({
                        where: { userId: user.id },
                    });
                    debug.userInPrisma.hasUsage = !!usage;
                }
            } catch (error: any) {
                debug.userInPrisma = {
                    error: error.message,
                };
            }
        }

        // Check environment variables
        debug.env = {
            hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            hasOpenAIKey: !!process.env.OPENAI_API_KEY,
            hasDatabaseUrl: !!process.env.DATABASE_URL,
        };

    } catch (error: any) {
        debug.error = {
            message: error.message,
            stack: error.stack,
        };
    }

    return NextResponse.json(debug, { status: 200 });
}


