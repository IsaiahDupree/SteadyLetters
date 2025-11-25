import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json(
                { error: 'Missing user ID' },
                { status: 400 }
            );
        }

        // Get user's Stripe customer ID
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { stripeCustomerId: true },
        });

        if (!user?.stripeCustomerId) {
            return NextResponse.json(
                { error: 'No subscription found' },
                { status: 404 }
            );
        }

        // Create Stripe Customer Portal session
        const session = await stripe.billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            return_url: `${process.env.NEXT_PUBLIC_URL}/billing`,
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('Portal session error:', error);
        return NextResponse.json(
            { error: 'Failed to create portal session' },
            { status: 500 }
        );
    }
}
