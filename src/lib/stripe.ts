import Stripe from 'stripe';
import { STRIPE_PLANS, type StripePlan } from './pricing-tiers';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-11-17.clover',
    typescript: true,
});

export { STRIPE_PLANS, type StripePlan };

export async function getOrCreateStripeCustomer(userId: string, email: string) {
    // Check if customer exists in database
    const { prisma } = await import('./prisma');
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { stripeCustomerId: true },
    });

    if (user?.stripeCustomerId) {
        return user.stripeCustomerId;
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
        email,
        metadata: { userId },
    });

    // Save to database
    await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customer.id },
    });

    return customer.id;
}
