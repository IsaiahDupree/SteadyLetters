"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const thanks_io_1 = require("../../lib/thanks-io");
const pricing_tiers_1 = require("../../lib/pricing-tiers");
const prisma_1 = require("../../lib/prisma");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
/**
 * POST /api/thanks-io/send
 * Send mail via Thanks.io API
 */
router.post('/', auth_1.authenticateRequest, async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                error: 'Unauthorized'
            });
        }
        const { productType, recipients, message, handwritingStyle, handwritingColor, frontImageUrl, postcardSize, pdfUrl, } = req.body;
        // Validate required fields
        if (!productType || !recipients || !message) {
            return res.status(400).json({
                error: 'Missing required fields: productType, recipients, message'
            });
        }
        // Get user's tier
        const dbUser = await prisma_1.prisma.user.findUnique({
            where: { id: user.id },
            select: { stripePriceId: true },
        });
        let userTier = 'free';
        if (dbUser?.stripePriceId) {
            const plan = Object.values(pricing_tiers_1.STRIPE_PLANS).find(p => p.priceId === dbUser.stripePriceId);
            if (plan?.name === 'Pro')
                userTier = 'pro';
            else if (plan?.name === 'Business')
                userTier = 'business';
        }
        // Check if user's tier allows this product type
        const allowedProducts = (0, thanks_io_1.getProductsForTier)(userTier);
        const productAllowed = allowedProducts.some(p => p.id === productType);
        if (!productAllowed) {
            const productInfo = thanks_io_1.PRODUCT_CATALOG[productType];
            return res.status(403).json({
                error: `${productInfo.name} requires ${productInfo.allowedTiers[productInfo.allowedTiers.length - 1]} tier or higher`,
                requiredTier: productInfo.allowedTiers[productInfo.allowedTiers.length - 1],
                currentTier: userTier,
            });
        }
        // Send based on product type
        let result;
        switch (productType) {
            case 'postcard':
                result = await (0, thanks_io_1.sendPostcard)({
                    recipients,
                    message,
                    front_image_url: frontImageUrl,
                    handwriting_style: handwritingStyle,
                    handwriting_color: handwritingColor,
                    size: postcardSize,
                });
                break;
            case 'letter':
                result = await (0, thanks_io_1.sendLetter)({
                    recipients,
                    message,
                    front_image_url: frontImageUrl,
                    handwriting_style: handwritingStyle,
                    handwriting_color: handwritingColor,
                });
                break;
            case 'greeting':
                result = await (0, thanks_io_1.sendGreetingCard)({
                    recipients,
                    message,
                    front_image_url: frontImageUrl,
                    handwriting_style: handwritingStyle,
                    handwriting_color: handwritingColor,
                });
                break;
            case 'windowless_letter':
                if (!pdfUrl) {
                    return res.status(400).json({
                        error: 'PDF URL required for windowless letters'
                    });
                }
                result = await (0, thanks_io_1.sendWindowlessLetter)({
                    recipients,
                    pdf_url: pdfUrl,
                    front_image_url: frontImageUrl,
                    handwriting_style: handwritingStyle,
                });
                break;
            default:
                return res.status(400).json({
                    error: `Unsupported product type: ${productType}`
                });
        }
        // Calculate cost based on product type
        let costPerItem = 0;
        switch (productType) {
            case 'postcard':
                costPerItem = (0, thanks_io_1.getPostcardPrice)(postcardSize || '4x6');
                break;
            case 'letter':
                costPerItem = thanks_io_1.PRODUCT_CATALOG.letter.basePrice;
                break;
            case 'greeting':
                costPerItem = thanks_io_1.PRODUCT_CATALOG.greeting.basePrice;
                break;
            case 'windowless_letter':
                costPerItem = thanks_io_1.PRODUCT_CATALOG.windowless_letter.basePrice;
                break;
            case 'giftcard':
                costPerItem = thanks_io_1.PRODUCT_CATALOG.giftcard.basePrice;
                break;
        }
        const totalCost = costPerItem * recipients.length;
        // Get or create user usage record
        let usage = await prisma_1.prisma.userUsage.findUnique({
            where: { userId: user.id },
        });
        if (!usage) {
            usage = await prisma_1.prisma.userUsage.create({
                data: {
                    userId: user.id,
                    tier: 'FREE',
                    resetAt: new Date(),
                },
            });
        }
        // Prepare update data for product-specific tracking
        const updateData = {
            lettersSent: { increment: recipients.length }, // Keep for backward compatibility
        };
        // Update product-specific counter if field exists
        // Note: These fields may not exist in schema yet, but we'll try
        switch (productType) {
            case 'postcard':
                // updateData.postcardsSent = { increment: recipients.length };
                break;
            case 'letter':
                // updateData.lettersSentStandard = { increment: recipients.length };
                break;
            case 'greeting':
                // updateData.greetingCardsSent = { increment: recipients.length };
                break;
            case 'windowless_letter':
                // updateData.windowlessLettersSent = { increment: recipients.length };
                break;
        }
        // Track usage
        await prisma_1.prisma.userUsage.update({
            where: { userId: user.id },
            data: updateData,
        });
        return res.json({
            success: true,
            order: result,
            productType,
            recipientCount: recipients.length,
            totalCost,
        });
    }
    catch (error) {
        console.error('Error sending mail:', error);
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to send mail'
        });
    }
});
exports.default = router;
