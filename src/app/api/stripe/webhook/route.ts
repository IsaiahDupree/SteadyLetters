import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { trackServerEvent } from '@/lib/posthog-server';

export async function POST(request: NextRequest) {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
        return NextResponse.json(
            { error: 'No signature' },
            { status: 400 }
        );
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error) {
        console.error('Webhook signature verification failed:', error);
        return NextResponse.json(
            { error: 'Invalid signature' },
            { status: 400 }
        );
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.metadata?.userId;

                if (!userId) break;

                const subscription = await stripe.subscriptions.retrieve(
                    session.subscription as string,
                    { expand: ['items.data.price'] }
                ) as Stripe.Subscription & {
                    items: {
                        data: Array<{
                            price: Stripe.Price;
                        }>;
                    };
                };

                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        stripeSubscriptionId: subscription.id,
                        stripePriceId: subscription.items.data[0].price.id,
                        stripeCurrentPeriodEnd: subscription.current_period_end 
                            ? new Date(subscription.current_period_end * 1000)
                            : null,
                    },
                });

                // Update user tier in UserUsage
                const priceId = subscription.items.data[0].price.id;
                let tier = 'FREE';

                if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
                    tier = 'PRO';
                } else if (priceId === process.env.STRIPE_BUSINESS_PRICE_ID) {
                    tier = 'BUSINESS';
                }

                await prisma.userUsage.update({
                    where: { userId },
                    data: { tier },
                });

                // Track subscription started in PostHog
                await trackServerEvent(userId, 'subscription_started', {
                    tier,
                    priceId,
                    subscriptionId: subscription.id,
                });

                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription & {
                    items: {
                        data: Array<{
                            price: Stripe.Price;
                        }>;
                    };
                };
                const customerId = subscription.customer as string;

                const user = await prisma.user.findUnique({
                    where: { stripeCustomerId: customerId },
                });

                if (!user) break;

                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        stripePriceId: subscription.items.data[0].price.id,
                        stripeCurrentPeriodEnd: subscription.current_period_end
                            ? new Date(subscription.current_period_end * 1000)
                            : null,
                    },
                });

                // Track subscription updated in PostHog
                await trackServerEvent(user.id, 'subscription_updated', {
                    priceId: subscription.items.data[0].price.id,
                    subscriptionId: subscription.id,
                });

                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;

                const user = await prisma.user.findUnique({
                    where: { stripeCustomerId: customerId },
                });

                if (!user) break;

                // Downgrade to FREE tier
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        stripeSubscriptionId: null,
                        stripePriceId: null,
                        stripeCurrentPeriodEnd: null,
                    },
                });

                await prisma.userUsage.update({
                    where: { userId: user.id },
                    data: { tier: 'FREE' },
                });

                // Track subscription cancelled in PostHog
                await trackServerEvent(user.id, 'subscription_cancelled', {
                    subscriptionId: subscription.id,
                });

                break;
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook handler error:', error);
        return NextResponse.json(
            { error: 'Webhook handler failed' },
            { status: 500 }
        );
    }
}
