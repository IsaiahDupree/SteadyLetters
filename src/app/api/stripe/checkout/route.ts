import { NextRequest, NextResponse } from 'next/server';
import { stripe, getOrCreateStripeCustomer } from '@/lib/stripe';

export async function POST(request: NextRequest) {
    try {
        const { priceId, userId, email } = await request.json();

        if (!priceId || !userId || !email) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Get or create Stripe customer
        const customerId = await getOrCreateStripeCustomer(userId, email);

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
                userId,
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('Checkout session error:', error);
        return NextResponse.json(
            { error: 'Failed to create checkout session' },
            { status: 500 }
        );
    }
}
