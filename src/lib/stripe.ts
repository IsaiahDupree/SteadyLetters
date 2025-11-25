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
    
    // Ensure user exists in Prisma first
    let user = await prisma.user.findUnique({
        where: { id: userId },
        select: { stripeCustomerId: true },
    });

    if (!user) {
        // User doesn't exist, create them
        user = await prisma.user.create({
            data: {
                id: userId,
                email,
            },
            select: { stripeCustomerId: true },
        });
    }

    if (user.stripeCustomerId) {
        return user.stripeCustomerId;
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
        email,
        metadata: { userId },
    });

    // Save to database (use upsert to handle race conditions)
    try {
        await prisma.user.update({
            where: { id: userId },
            data: { stripeCustomerId: customer.id },
        });
    } catch (error) {
        // If update fails, try to get the customer ID that might have been set by another request
        const updatedUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { stripeCustomerId: true },
        });
        if (updatedUser?.stripeCustomerId) {
            return updatedUser.stripeCustomerId;
        }
        throw error;
    }

    return customer.id;
}
