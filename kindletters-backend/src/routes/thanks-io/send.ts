import { Router, Request, Response } from 'express';
import {
    sendPostcard,
    sendLetter,
    sendGreetingCard,
    sendWindowlessLetter,
    ProductType,
    PostcardSize,
    getProductsForTier,
    PRODUCT_CATALOG,
    getPostcardPrice,
} from '../../lib/thanks-io';
import { STRIPE_PLANS } from '../../lib/pricing-tiers';
import { prisma } from '../../lib/prisma';
import { authenticateRequest } from '../../middleware/auth';

const router = Router();

/**
 * POST /api/thanks-io/send
 * Send mail via Thanks.io API
 */
router.post('/', authenticateRequest, async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;

        if (!user) {
            return res.status(401).json({
                error: 'Unauthorized'
            });
        }

        const {
            productType,
            recipients,
            message,
            handwritingStyle,
            handwritingColor,
            frontImageUrl,
            postcardSize,
            pdfUrl,
        } = req.body;

        // Validate required fields
        if (!productType || !recipients || !message) {
            return res.status(400).json({
                error: 'Missing required fields: productType, recipients, message'
            });
        }

        // Get user's tier
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { stripePriceId: true },
        });

        let userTier: 'free' | 'pro' | 'business' = 'free';
        if (dbUser?.stripePriceId) {
            const plan = Object.values(STRIPE_PLANS).find(
                p => p.priceId === dbUser.stripePriceId
            );
            if (plan?.name === 'Pro') userTier = 'pro';
            else if (plan?.name === 'Business') userTier = 'business';
        }

        // Check if user's tier allows this product type
        const allowedProducts = getProductsForTier(userTier);
        const productAllowed = allowedProducts.some(p => p.id === productType);

        if (!productAllowed) {
            const productInfo = PRODUCT_CATALOG[productType as ProductType];
            return res.status(403).json({
                error: `${productInfo.name} requires ${productInfo.allowedTiers[productInfo.allowedTiers.length - 1]} tier or higher`,
                requiredTier: productInfo.allowedTiers[productInfo.allowedTiers.length - 1],
                currentTier: userTier,
            });
        }

        // Send based on product type
        let result;

        switch (productType as ProductType) {
            case 'postcard':
                result = await sendPostcard({
                    recipients,
                    message,
                    front_image_url: frontImageUrl,
                    handwriting_style: handwritingStyle,
                    handwriting_color: handwritingColor,
                    size: postcardSize as PostcardSize,
                });
                break;

            case 'letter':
                result = await sendLetter({
                    recipients,
                    message,
                    front_image_url: frontImageUrl,
                    handwriting_style: handwritingStyle,
                    handwriting_color: handwritingColor,
                });
                break;

            case 'greeting':
                result = await sendGreetingCard({
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
                result = await sendWindowlessLetter({
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
        switch (productType as ProductType) {
            case 'postcard':
                costPerItem = getPostcardPrice(postcardSize || '4x6');
                break;
            case 'letter':
                costPerItem = PRODUCT_CATALOG.letter.basePrice;
                break;
            case 'greeting':
                costPerItem = PRODUCT_CATALOG.greeting.basePrice;
                break;
            case 'windowless_letter':
                costPerItem = PRODUCT_CATALOG.windowless_letter.basePrice;
                break;
            case 'giftcard':
                costPerItem = PRODUCT_CATALOG.giftcard.basePrice;
                break;
        }

        const totalCost = costPerItem * recipients.length;

        // Get or create user usage record
        let usage = await prisma.userUsage.findUnique({
            where: { userId: user.id },
        });

        if (!usage) {
            usage = await prisma.userUsage.create({
                data: {
                    userId: user.id,
                    tier: 'FREE',
                    resetAt: new Date(),
                },
            });
        }

        // Prepare update data for product-specific tracking
        const updateData: any = {
            lettersSent: { increment: recipients.length }, // Keep for backward compatibility
        };

        // Update product-specific counter if field exists
        // Note: These fields may not exist in schema yet, but we'll try
        switch (productType as ProductType) {
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
        await prisma.userUsage.update({
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

    } catch (error: any) {
        console.error('Error sending mail:', error);
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to send mail'
        });
    }
});

export default router;

