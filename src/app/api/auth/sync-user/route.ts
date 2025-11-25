import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        // Validate environment variables
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            console.error('Missing Supabase environment variables');
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }

        let response = NextResponse.next({
            request: {
                headers: request.headers,
            },
        });

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    get(name: string) {
                        return request.cookies.get(name)?.value;
                    },
                    set(name: string, value: string, options: any) {
                        request.cookies.set({
                            name,
                            value,
                            ...options,
                        });
                        response = NextResponse.next({
                            request: {
                                headers: request.headers,
                            },
                        });
                        response.cookies.set({
                            name,
                            value,
                            ...options,
                        });
                    },
                    remove(name: string, options: any) {
                        request.cookies.set({
                            name,
                            value: '',
                            ...options,
                        });
                        response = NextResponse.next({
                            request: {
                                headers: request.headers,
                            },
                        });
                        response.cookies.set({
                            name,
                            value: '',
                            ...options,
                        });
                    },
                },
            }
        );
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Check if user exists in Prisma
        const existingUser = await prisma.user.findUnique({
            where: { id: user.id },
        });

        if (!existingUser) {
            // Create user in Prisma (use upsert to handle race conditions)
            await prisma.user.upsert({
                where: { id: user.id },
                update: {},
                create: {
                    id: user.id,
                    email: user.email!,
                },
            });

            // Create initial UserUsage record (use upsert to handle race conditions)
            const now = new Date();
            const resetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            await prisma.userUsage.upsert({
                where: { userId: user.id },
                update: {},
                create: {
                    userId: user.id,
                    tier: 'FREE',
                    resetAt,
                },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Sync user error:', error);
        
        // Provide more detailed error in development
        const errorMessage = process.env.NODE_ENV === 'development'
            ? error.message || 'Failed to sync user'
            : 'Failed to sync user. Please try again.';
        
        return NextResponse.json(
            { 
                error: errorMessage,
                ...(process.env.NODE_ENV === 'development' && { 
                    details: error.stack,
                    type: error.constructor?.name,
                    code: error.code,
                })
            },
            { status: 500 }
        );
    }
}
