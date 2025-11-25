import { NextRequest, NextResponse } from 'next/server';
import { stripe, getOrCreateStripeCustomer } from '@/lib/stripe';
import { getAuthenticatedUser } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
    try {
        // Get authenticated user
        const user = await getAuthenticatedUser(request);
        
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized. Please sign in to purchase a plan.' },
                { status: 401 }
            );
        }

        const { priceId } = await request.json();

        if (!priceId) {
            return NextResponse.json(
                { error: 'Missing priceId' },
                { status: 400 }
            );
        }

        // Ensure user exists in Prisma and create UserUsage if needed
        const { prisma } = await import('@/lib/prisma');
        
        // Use upsert to handle race conditions
        await prisma.user.upsert({
            where: { id: user.id },
            update: {}, // No update needed if exists
            create: {
                id: user.id,
                email: user.email!,
            },
        });

        // Ensure UserUsage exists
        const now = new Date();
        const resetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        await prisma.userUsage.upsert({
            where: { userId: user.id },
            update: {}, // No update needed if exists
            create: {
                userId: user.id,
                tier: 'FREE',
                resetAt,
            },
        });

        // Get or create Stripe customer
        const customerId = await getOrCreateStripeCustomer(user.id, user.email!);

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing?canceled=true`,
            metadata: {
                userId: user.id,
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error('Checkout session error:', error);
        
        // Provide more detailed error information in development
        const errorMessage = process.env.NODE_ENV === 'development' 
            ? error.message || 'Failed to create checkout session'
            : 'Failed to create checkout session';
        
        return NextResponse.json(
            { 
                error: errorMessage,
                ...(process.env.NODE_ENV === 'development' && { details: error.stack })
            },
            { status: 500 }
        );
    }
}
