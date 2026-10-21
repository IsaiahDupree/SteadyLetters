import { Router, Request, Response } from 'express';
import { getProductsForTier, PRODUCT_CATALOG } from '../../lib/thanks-io';
import { STRIPE_PLANS } from '../../lib/pricing-tiers';
import { prisma } from '../../lib/prisma';
import { authenticateRequest } from '../../middleware/auth';

const router = Router();

/**
 * GET /api/thanks-io/products
 * Get available Thanks.io products for user's tier
 */
router.get('/', authenticateRequest, async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;

        if (!user) {
            return res.status(401).json({
                error: 'Unauthorized'
            });
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

        return res.json({
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
        
        return res.status(500).json({
            error: errorMessage,
            ...(process.env.NODE_ENV === 'development' && { 
                details: error.message,
            })
        });
    }
});

export default router;

