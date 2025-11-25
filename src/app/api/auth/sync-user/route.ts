import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Sync Supabase auth user to Prisma User model
 * This should be called after user signs up or signs in
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = createServerSupabaseClient();
        
        // Get the authenticated user from Supabase
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !authUser) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Check if user exists in Prisma
        let user = await prisma.user.findUnique({
            where: { email: authUser.email! },
        });

        // Create user if doesn't exist
        if (!user) {
            user = await prisma.user.create({
                data: {
                    id: authUser.id,
                    email: authUser.email!,
                },
            });

            // Create UserUsage record
            await prisma.userUsage.create({
                data: {
                    userId: user.id,
                    tier: 'FREE',
                },
            });
        }

        return NextResponse.json({ user });
    } catch (error) {
        console.error('Error syncing user:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

