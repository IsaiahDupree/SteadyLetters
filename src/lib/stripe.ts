import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-11-17.clover',
    typescript: true,
});

export const STRIPE_PLANS = {
    FREE: {
        name: 'Free',
        price: 0,
        priceId: null,
        features: [
            '5 letter generations/month',
            '10 image generations/month',
            '3 letters sent/month',
            '5 voice transcriptions/month',
            '3 image analyses/month',
        ],
    },
    PRO: {
        name: 'Pro',
        price: 9.99,
        priceId: process.env.STRIPE_PRO_PRICE_ID!,
        features: [
            '50 letter generations/month',
            '100 image generations/month',
            '25 letters sent/month',
            '100 voice transcriptions/month',
            '50 image analyses/month',
            'Email support',
        ],
    },
    BUSINESS: {
        name: 'Business',
        price: 29.99,
        priceId: process.env.STRIPE_BUSINESS_PRICE_ID!,
        features: [
            'Unlimited letter generations',
            'Unlimited image generations',
            '100 letters sent/month',
            'Unlimited voice transcriptions',
            'Unlimited image analyses',
            'Priority support',
            'Custom branding',
        ],
    },
} as const;

export type StripePlan = keyof typeof STRIPE_PLANS;

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
