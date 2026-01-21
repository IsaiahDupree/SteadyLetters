"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const thanks_io_1 = require("../../lib/thanks-io");
const pricing_tiers_1 = require("../../lib/pricing-tiers");
const prisma_1 = require("../../lib/prisma");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
/**
 * GET /api/thanks-io/products
 * Get available Thanks.io products for user's tier
 */
router.get('/', auth_1.authenticateRequest, async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                error: 'Unauthorized'
            });
        }
        // Ensure user exists in Prisma (upsert to handle race conditions)
        const dbUser = await prisma_1.prisma.user.upsert({
            where: { id: user.id },
            update: {},
            create: {
                id: user.id,
                email: user.email || '',
            },
            select: { stripePriceId: true },
        });
        // Determine user's tier based on their Stripe price ID
        let userTier = 'free';
        if (dbUser?.stripePriceId) {
            const plan = Object.values(pricing_tiers_1.STRIPE_PLANS).find(p => p.priceId === dbUser.stripePriceId);
            if (plan?.name === 'Pro') {
                userTier = 'pro';
            }
            else if (plan?.name === 'Business') {
                userTier = 'business';
            }
        }
        // Get available products for the user's tier
        const availableProducts = (0, thanks_io_1.getProductsForTier)(userTier);
        return res.json({
            tier: userTier,
            products: availableProducts,
            allProducts: thanks_io_1.PRODUCT_CATALOG,
        });
    }
    catch (error) {
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
exports.default = router;
