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
    PRODUCT_CATALOG
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

        // Track usage - increment lettersSent counter
        await prisma.userUsage.upsert({
            where: { userId: user.id },
            update: {
                lettersSent: { increment: recipients.length },
            },
            create: {
                userId: user.id,
                tier: 'FREE',
                lettersSent: recipients.length,
            },
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
