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

        // Ensure user exists in Prisma (upsert to handle race conditions)
        const dbUser = await prisma.user.upsert({
            where: { id: user.id },
            update: {},
            create: {
                id: user.id,
                email: user.email || '',
            },
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
    } catch (error: any) {
        console.error('Error fetching products:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            name: error.name,
        });
        
        const errorMessage = process.env.NODE_ENV === 'development'
            ? error.message || 'Failed to fetch products'
            : 'Failed to fetch products';
        
        return NextResponse.json(
            { 
                error: errorMessage,
                ...(process.env.NODE_ENV === 'development' && { 
                    details: error.message,
                })
            },
            { status: 500 }
        );
    }
}
