import express, { Router, Request, Response } from 'express';
import { stripe } from '../../lib/stripe';
import { prisma } from '../../lib/prisma';
import Stripe from 'stripe';

const router = Router();

/**
 * POST /api/stripe/webhook
 * Handle Stripe webhook events
 * Note: This route must receive raw body (not parsed JSON) for signature verification
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
        return res.status(400).json({
            error: 'No signature'
        });
    }

    const rawBody = req.body as Buffer;
    if (!rawBody) {
        return res.status(400).json({
            error: 'No body'
        });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            rawBody,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: any) {
        console.error('Webhook signature verification failed:', error);
        return res.status(400).json({
            error: 'Invalid signature'
        });
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
                ) as any;

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

                if (priceId === process.env.STRIPE_PRO_PRICE_ID || priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID) {
                    tier = 'PRO';
                } else if (priceId === process.env.STRIPE_BUSINESS_PRICE_ID || priceId === process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID) {
                    tier = 'BUSINESS';
                }

                await prisma.userUsage.update({
                    where: { userId },
                    data: { tier },
                });

                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as any;
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

                break;
            }
        }

        return res.json({ received: true });
    } catch (error: any) {
        console.error('Webhook handler error:', error);
        return res.status(500).json({
            error: 'Webhook handler failed'
        });
    }
});

export default router;

