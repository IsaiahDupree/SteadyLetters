import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { getProductsForTier, PRODUCT_CATALOG } from '@/lib/thanks-io';
import { STRIPE_PLANS } from '@/lib/pricing-tiers';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser(request);

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get user's subscription tier from database
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { stripePriceId: true },
        });

        // Determine user's tier based on their Stripe price ID
        let userTier: 'free' | 'pro' | 'business' = 'free';

        if (dbUser?.stripePriceId) {
            const plan = Object.values(STRIPE_PLANS).find(
                p => p.priceId === dbUser.stripePriceId
            );

            if (plan?.name === 'Pro') {
                userTier = 'pro';
            } else if (plan?.name === 'Business') {
                userTier = 'business';
            }
        }

        // Get available products for the user's tier
        const availableProducts = getProductsForTier(userTier);

        return NextResponse.json({
            tier: userTier,
            products: availableProducts,
            allProducts: PRODUCT_CATALOG,
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json(
            { error: 'Failed to fetch products' },
            { status: 500 }
        );
    }
}
