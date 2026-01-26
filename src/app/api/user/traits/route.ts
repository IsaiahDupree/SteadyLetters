import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { prisma } from '@/lib/prisma';
import { getOrCreatePersonFromUser } from '@/lib/identity.js';

export async function GET(request: NextRequest) {
    try {
        // Get authenticated user
        const cookieStore = request.cookies;
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        // Not used in GET request
                    },
                    remove(name: string, options: CookieOptions) {
                        // Not used in GET request
                    },
                },
            }
        );

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch user data from database
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: {
                usage: true,
            },
        });

        if (!dbUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Get or create Person record and link to user
        const person = await getOrCreatePersonFromUser(
            user.id,
            user.email || '',
            user.user_metadata?.first_name,
            user.user_metadata?.last_name
        );

        // Build user traits for tracking
        const traits: Record<string, any> = {
            person_id: person.id,
            tier: dbUser.usage?.tier || 'FREE',
            created_at: dbUser.createdAt.toISOString(),
        };

        // Add subscription info if available
        if (dbUser.stripeCustomerId) {
            traits.stripe_customer_id = dbUser.stripeCustomerId;
        }
        if (dbUser.stripeSubscriptionId) {
            traits.stripe_subscription_id = dbUser.stripeSubscriptionId;
            traits.subscription_active = true;
        }
        if (dbUser.stripePriceId) {
            traits.price_id = dbUser.stripePriceId;
        }
        if (dbUser.stripeCurrentPeriodEnd) {
            traits.subscription_period_end = dbUser.stripeCurrentPeriodEnd.toISOString();
        }

        // Add usage stats if available
        if (dbUser.usage) {
            traits.letters_sent = dbUser.usage.lettersSent;
            traits.letter_generations = dbUser.usage.letterGenerations;
            traits.image_generations = dbUser.usage.imageGenerations;
            traits.voice_transcriptions = dbUser.usage.voiceTranscriptions;
            traits.total_spent = dbUser.usage.totalSpent.toString();
        }

        return NextResponse.json(traits);
    } catch (error) {
        console.error('Error fetching user traits:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
