import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Check if user exists in Prisma
        const existingUser = await prisma.user.findUnique({
            where: { id: user.id },
        });

        if (!existingUser) {
            // Create user in Prisma
            await prisma.user.create({
                data: {
                    id: user.id,
                    email: user.email!,
                },
            });

            // Create initial UserUsage record
            await prisma.userUsage.create({
                data: {
                    userId: user.id,
                    tier: 'FREE',
                },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Sync user error:', error);
        return NextResponse.json(
            { error: 'Failed to sync user' },
            { status: 500 }
        );
    }
}
