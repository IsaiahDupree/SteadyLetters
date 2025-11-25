// Pricing tier constants - safe for client-side use
// Based on comprehensive cost analysis (see tierresearch.txt)
// Pro tier priced at $29.99 for CAC recovery by month 2
// Mailing costs ~$2-3 per letter, AI features cost pennies
export const STRIPE_PLANS = {
    FREE: {
        name: 'Free',
        price: 0,
        priceId: null,
        features: [
            '5 AI letter generations/month',
            '10 image generations/month',
            '3 letters mailed/month',
            '5 voice transcriptions/month',
            '5 image analyses/month',
        ],
    },
    PRO: {
        name: 'Pro',
        price: 29.99,
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || process.env.STRIPE_PRO_PRICE_ID!,
        features: [
            '50 AI letter generations/month',
            '100 image generations/month',
            '10 letters mailed/month',
            'Unlimited voice transcriptions',
            'Unlimited image analyses',
            'Email support',
            '$2/letter after limit',
        ],
    },
    BUSINESS: {
        name: 'Business',
        price: 59.99,
        priceId: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID || process.env.STRIPE_BUSINESS_PRICE_ID!,
        features: [
            '200 AI letter generations/month',
            '400 image generations/month',
            '50 letters mailed/month',
            'Unlimited voice transcriptions',
            'Unlimited image analyses',
            'Priority support',
            'Custom branding',
            '$1.50/letter after limit',
        ],
    },
} as const;

export type StripePlan = keyof typeof STRIPE_PLANS;
