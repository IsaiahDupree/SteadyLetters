import { Router, Request, Response } from 'express';
import multer from 'multer';
import { openai } from '../lib/openai';
import { prisma } from '../lib/prisma';
import { canGenerate } from '../lib/tiers';
import { trackEvent } from '../lib/events';
import { authenticateRequest } from '../middleware/auth';

const router = Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 20 * 1024 * 1024, // 20MB max for Vision API
    },
});

/**
 * POST /api/analyze-image
 * Analyze an image using GPT-4 Vision
 */
router.post('/', authenticateRequest, upload.single('image'), async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;

        if (!user) {
            return res.status(401).json({
                error: 'Unauthorized. Please sign in to use this feature.'
            });
        }

        const imageFile = req.file;

        if (!imageFile) {
            return res.status(400).json({
                error: 'No image file provided'
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

        // Check if user can analyze images
        // For now, we'll use image generation limits
        // TODO: Add separate imageAnalyses limit
        if (!canGenerate(usage, 'image')) {
            await trackEvent({
                userId,
                eventType: 'limit_reached',
                metadata: { type: 'image_analysis', tier: usage.tier },
            });

            return res.status(403).json({
                error: 'You have reached your image analysis limit. Please upgrade your plan.'
            });
        }

        // Convert image buffer to base64 for Vision API
        const base64Image = imageFile.buffer.toString('base64');
        const imageUrl = `data:${imageFile.mimetype};base64,${base64Image}`;

        // Analyze image using GPT-4 Vision
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: 'Describe this image in detail. Include colors, mood, objects, people, settings, and any text visible. Focus on elements that would be suitable for creating a personalized greeting card design. Be concise but descriptive (2-3 sentences).',
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: imageUrl,
                            },
                        },
                    ],
                },
            ],
            max_tokens: 300,
        });

        const analysis = response.choices[0].message.content || '';

        // Increment usage counter
        await prisma.userUsage.update({
            where: { userId },
            data: {
                imageAnalyses: { increment: 1 },
            },
        });

        // Track event
        await trackEvent({
            userId,
            eventType: 'image_analyzed',
            metadata: {
                fileSize: imageFile.size,
                fileType: imageFile.mimetype,
                analysisLength: analysis.length,
            },
        });

        return res.json({
            analysis,
        });
    } catch (error: any) {
        console.error('Image analysis error:', error);
        
        // Provide more detailed error in development
        const errorMessage = process.env.NODE_ENV === 'development'
            ? error.message || 'Failed to analyze image'
            : 'Failed to analyze image. Please try again.';
        
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

