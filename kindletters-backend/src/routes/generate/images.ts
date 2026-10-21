import { Router, Request, Response } from 'express';
import { generateCardImage } from '../../lib/openai';
import { prisma } from '../../lib/prisma';
import { canGenerate } from '../../lib/tiers';
import { trackEvent } from '../../lib/events';
import { authenticateRequest } from '../../middleware/auth';

const router = Router();

/**
 * POST /api/generate/images
 * Generate 4 card images using DALL-E 3
 */
router.post('/', authenticateRequest, async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;

        if (!user) {
            return res.status(401).json({
                error: 'Unauthorized. Please sign in to generate images.'
            });
        }

        const { occasion, tone, holiday, imageAnalysis } = req.body;

        if (!occasion || !tone) {
            return res.status(400).json({
                error: 'Missing required fields'
            });
        }

        // Ensure user exists in Prisma
        const userId = user.id;
        await prisma.user.upsert({
            where: { id: userId },
            update: {},
            create: {
                id: userId,
                email: user.email!,
            },
        });

        // Get or create user usage record
        let usage = await prisma.userUsage.findUnique({
            where: { userId },
        });

        if (!usage) {
            // Calculate next month's 1st day for resetAt
            const now = new Date();
            const resetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            usage = await prisma.userUsage.create({
                data: { userId, tier: 'FREE', resetAt },
            });
        }

        // Check if user can generate images (need 4 credits for 4 images)
        const canGenerateImages = canGenerate(usage, 'image');
        if (!canGenerateImages) {
            await trackEvent({
                userId,
                eventType: 'limit_reached',
                metadata: { type: 'image_generation', tier: usage.tier },
            });

            return res.status(403).json({
                error: 'You have reached your image generation limit. Please upgrade your plan.'
            });
        }

        // Generate 4 images using DALL-E 3
        const imagePromises = Array.from({ length: 4 }, (_, i) =>
            generateCardImage({ occasion, tone, holiday, imageAnalysis }).catch(error => {
                console.error(`Failed to generate image ${i + 1}:`, error);
                return null;
            })
        );

        const images = await Promise.all(imagePromises);

        // Filter out failed generations
        const validImages = images.filter((url): url is string => url !== null);

        if (validImages.length === 0) {
            return res.status(500).json({
                error: 'Failed to generate images. Please try again.'
            });
        }

        // Increment usage counter by the number of images generated
        await prisma.userUsage.update({
            where: { userId },
            data: {
                imageGenerations: { increment: validImages.length },
            },
        });

        // Track event for each image generated
        for (let i = 0; i < validImages.length; i++) {
            await trackEvent({
                userId,
                eventType: 'image_generated',
                metadata: {
                    occasion,
                    tone,
                    tier: usage.tier,
                },
            });
        }

        return res.json({ images: validImages });
    } catch (error: any) {
        console.error('Failed to generate images:', error);
        
        // Provide more detailed error in development
        const errorMessage = process.env.NODE_ENV === 'development'
            ? error.message || 'Failed to generate images'
            : 'Failed to generate images. Please try again.';
        
        return res.status(500).json({
            error: errorMessage,
            ...(process.env.NODE_ENV === 'development' && { 
                details: error.stack,
                type: error.constructor?.name 
            })
        });
    }
});

export default router;

