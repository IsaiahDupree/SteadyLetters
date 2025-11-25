import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api-auth';
import {
    sendPostcard,
    sendLetter,
    sendGreetingCard,
    sendWindowlessLetter,
    ProductType,
    PostcardSize,
    Recipient,
    getProductsForTier,
    PRODUCT_CATALOG,
    getPostcardPrice,
} from '@/lib/thanks-io';
import { STRIPE_PLANS } from '@/lib/pricing-tiers';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser(request);

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const {
            productType,
            recipients,
            message,
            handwritingStyle,
            handwritingColor,
            frontImageUrl,
            postcardSize,
            pdfUrl,
        } = body;

        // Validate required fields
        if (!productType || !recipients || !message) {
            return NextResponse.json(
                { error: 'Missing required fields: productType, recipients, message' },
                { status: 400 }
            );
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
            return NextResponse.json(
                {
                    error: `${productInfo.name} requires ${productInfo.allowedTiers[productInfo.allowedTiers.length - 1]} tier or higher`,
                    requiredTier: productInfo.allowedTiers[productInfo.allowedTiers.length - 1],
                    currentTier: userTier,
                },
                { status: 403 }
            );
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
                    return NextResponse.json(
                        { error: 'PDF URL required for windowless letters' },
                        { status: 400 }
                    );
                }
                result = await sendWindowlessLetter({
                    recipients,
                    pdf_url: pdfUrl,
                    front_image_url: frontImageUrl,
                    handwriting_style: handwritingStyle,
                });
                break;

            default:
                return NextResponse.json(
                    { error: `Unsupported product type: ${productType}` },
                    { status: 400 }
                );
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
                // Note: Gift card value would be added separately if provided
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
            totalSpent: { increment: totalCost },
        };

        // Update product-specific counter
        switch (productType as ProductType) {
            case 'postcard':
                updateData.postcardsSent = { increment: recipients.length };
                break;
            case 'letter':
                updateData.lettersSentStandard = { increment: recipients.length };
                break;
            case 'greeting':
                updateData.greetingCardsSent = { increment: recipients.length };
                break;
            case 'windowless_letter':
                updateData.windowlessLettersSent = { increment: recipients.length };
                break;
            case 'giftcard':
                updateData.giftCardsSent = { increment: recipients.length };
                break;
        }

        // Track usage - update product-specific counters and total cost
        await prisma.userUsage.update({
            where: { userId: user.id },
            data: updateData,
        });

        return NextResponse.json({
            success: true,
            order: result,
            productType,
            recipientCount: recipients.length,
        });

    } catch (error) {
        console.error('Error sending mail:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to send mail' },
            { status: 500 }
        );
    }
}
