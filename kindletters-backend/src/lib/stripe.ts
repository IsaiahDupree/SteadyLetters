import Stripe from 'stripe';
import { STRIPE_PLANS, type StripePlan } from './pricing-tiers';

// Lazy initialization - only create Stripe client when actually used
// This prevents crashes if STRIPE_SECRET_KEY is not set at module load time
let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
    if (!stripeInstance) {
        const apiKey = process.env.STRIPE_SECRET_KEY;
        if (!apiKey) {
            throw new Error('STRIPE_SECRET_KEY environment variable is not set');
        }
        stripeInstance = new Stripe(apiKey, {
            apiVersion: '2025-11-17.clover',
            typescript: true,
        });
    }
    return stripeInstance;
}

// Export as a getter that works in both ESM and CommonJS
// This ensures Stripe is only initialized when actually accessed
export const stripe = new Proxy({} as Stripe, {
    get(_target, prop) {
        const client = getStripe();
        const value = (client as any)[prop];
        // If it's a function, bind it to the client
        if (typeof value === 'function') {
            return value.bind(client);
        }
        return value;
    },
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
