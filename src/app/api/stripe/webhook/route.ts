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
                        stripeCurrentPeriodEnd: (subscription as any).current_period_end
                            ? new Date((subscription as any).current_period_end * 1000)
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

                // Get subscription price for tracking
                const price = subscription.items.data[0].price;
                const amount = price.unit_amount ? price.unit_amount / 100 : 0; // Convert cents to dollars

                // Track purchase completed (monetization milestone)
                await trackServerEvent(userId, 'purchase_completed', {
                    value: amount,
                    currency: price.currency?.toUpperCase() || 'USD',
                    transaction_id: session.id,
                    plan: tier,
                });

                // Track subscription started
                await trackServerEvent(userId, 'subscription_started', {
                    plan: tier,
                    value: amount,
                    currency: price.currency?.toUpperCase() || 'USD',
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
                        stripeCurrentPeriodEnd: (subscription as any).current_period_end
                            ? new Date((subscription as any).current_period_end * 1000)
                            : null,
                    },
                });

                // Get updated subscription price
                const price = subscription.items.data[0].price;
                const amount = price.unit_amount ? price.unit_amount / 100 : 0;

                // Determine the new tier
                const priceId = price.id;
                let newTier = 'FREE';
                if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
                    newTier = 'PRO';
                } else if (priceId === process.env.STRIPE_BUSINESS_PRICE_ID) {
                    newTier = 'BUSINESS';
                }

                // Update tier in database
                await prisma.userUsage.update({
                    where: { userId: user.id },
                    data: { tier: newTier },
                });

                // Track subscription updated/changed
                await trackServerEvent(user.id, 'subscription_updated', {
                    plan: newTier,
                    value: amount,
                    currency: price.currency?.toUpperCase() || 'USD',
                    priceId: price.id,
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

                // Track subscription cancelled/deleted
                await trackServerEvent(user.id, 'subscription_cancelled', {
                    subscriptionId: subscription.id,
                    reason: 'deleted', // Stripe deleted event
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
