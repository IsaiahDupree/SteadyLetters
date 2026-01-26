import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { trackServerEvent } from '@/lib/posthog-server';
import { getOrCreatePersonFromStripe } from '@/lib/identity.js';

/**
 * Upsert PersonSubscription from Stripe subscription object
 */
async function upsertPersonSubscription(
    personId: string,
    subscription: Stripe.Subscription
) {
    // Get first price item
    const items = subscription.items as unknown as { data: Array<{ price: Stripe.Price }> };
    const price = items.data[0].price;
    const priceId = price.id;
    const amount = price.unit_amount ? price.unit_amount / 100 : 0;

    // Determine tier
    let tier = 'FREE';
    if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
        tier = 'PRO';
    } else if (priceId === process.env.STRIPE_BUSINESS_PRICE_ID) {
        tier = 'BUSINESS';
    }

    await prisma.personSubscription.upsert({
        where: { stripeSubscriptionId: subscription.id },
        update: {
            status: subscription.status,
            plan: tier,
            mrr: amount,
            stripePriceId: priceId,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
        },
        create: {
            personId,
            stripeCustomerId: subscription.customer as string,
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId,
            status: subscription.status,
            plan: tier,
            mrr: amount,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
        },
    });
}

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
                    { expand: ['items.data.price', 'customer'] }
                ) as Stripe.Subscription & {
                    items: {
                        data: Array<{
                            price: Stripe.Price;
                        }>;
                    };
                    customer: Stripe.Customer;
                };

                const customer = subscription.customer as Stripe.Customer;
                const stripeCustomerId = typeof customer === 'string' ? customer : customer.id;

                // Update User table (existing logic)
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

                // GDP-007: Link stripe_customer_id to person_id
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { email: true },
                });

                if (user?.email) {
                    const customerName = typeof customer === 'string' ? '' : (customer.name || '');
                    const [firstName, ...lastNameParts] = customerName.split(' ');
                    const lastName = lastNameParts.join(' ');

                    const person = await getOrCreatePersonFromStripe(
                        stripeCustomerId,
                        user.email,
                        firstName || undefined,
                        lastName || undefined
                    );

                    // GDP-008: Upsert subscription snapshot
                    await upsertPersonSubscription(person.id, subscription);
                }

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
                        stripeCurrentPeriodEnd: subscription.current_period_end
                            ? new Date(subscription.current_period_end * 1000)
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

                // GDP-007: Update Person record
                const person = await getOrCreatePersonFromStripe(
                    customerId,
                    user.email,
                    undefined,
                    undefined
                );

                // GDP-008: Update subscription snapshot
                await upsertPersonSubscription(person.id, subscription);

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

                // GDP-008: Update PersonSubscription status to 'canceled'
                await prisma.personSubscription.updateMany({
                    where: { stripeSubscriptionId: subscription.id },
                    data: {
                        status: 'canceled',
                        plan: 'FREE',
                        mrr: 0,
                    },
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
