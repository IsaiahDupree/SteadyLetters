import { Router, Request, Response } from 'express';
import { openai } from '../../lib/openai';
import { prisma } from '../../lib/prisma';
import { trackEvent } from '../../lib/events';
import { canGenerate } from '../../lib/tiers';
import { authenticateRequest } from '../../middleware/auth';

const router = Router();

/**
 * POST /api/generate/card-image
 * Generate a single card front image using DALL-E 3
 */
router.post('/', authenticateRequest, async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;

        if (!user) {
            return res.status(401).json({
                error: 'Unauthorized. Please sign in to generate images.'
            });
        }

        const { tone, occasion, letterContent, imageAnalysis } = req.body;

        if (!tone && !occasion && !letterContent) {
            return res.status(400).json({
                error: 'Missing context for image generation (need tone, occasion, or letter content)'
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

        // Check if user can generate images
        if (!canGenerate(usage, 'image')) {
            // Track limit reached event
            await trackEvent({
                userId,
                eventType: 'limit_reached',
                metadata: { type: 'image_generation', tier: usage.tier },
            });

            return res.status(403).json({
                error: 'You have reached your image generation limit. Please upgrade your plan.'
            });
        }

        // Build comprehensive prompt for card front design
        const occasionDescriptions: Record<string, string> = {
            general: 'elegant and timeless greeting card',
            birthday: 'joyful birthday card with celebratory elements like balloons, confetti, or festive patterns',
            holiday: 'festive holiday-themed card with seasonal decorations',
            congratulations: 'celebratory card with uplifting and victorious imagery',
            'thank-you': 'warm and appreciative card with heartfelt elements like flowers or nature',
            sympathy: 'gentle and comforting card with soft, peaceful imagery',
            'get-well-soon': 'uplifting card with bright, hopeful elements',
        };

        const toneDescriptions: Record<string, string> = {
            formal: 'sophisticated, classic design with refined colors and elegant patterns',
            casual: 'relaxed, friendly design with bright, approachable colors',
            warm: 'inviting design with soft pastels, gentle gradients, and cozy elements',
            professional: 'clean, modern design with minimalist aesthetic and refined palette',
            friendly: 'cheerful, welcoming design with vibrant colors and positive energy',
        };

        const occasionDesc = occasionDescriptions[occasion as string] || 'elegant greeting card';
        const toneDesc = toneDescriptions[tone as string] || 'warm and inviting design';

        // Build context from image analysis
        const imageContext = imageAnalysis 
            ? `\n\nVisual inspiration: ${imageAnalysis}. Incorporate similar colors, mood, patterns, and aesthetic elements.`
            : '';

        // Build context from letter content (extract key themes)
        const letterContext = letterContent && typeof letterContent === 'string'
            ? `\n\nLetter themes to reflect: The letter expresses ${letterContent.substring(0, 200)}...`
            : '';

        const comprehensivePrompt = `
CARD FRONT DESIGN - COMPLETE FULL-PAGE LAYOUT:

Design the ENTIRE front face of a ${occasionDesc}.
This is a SINGLE-SIDED, FULL-PAGE card front design (not front and back, not a folded card).

STYLE REQUIREMENTS:
${toneDesc}${imageContext}${letterContext}

DESIGN SPECIFICATIONS:
- Fill the ENTIRE rectangular card front with a cohesive, complete design
- Create a unified composition from edge to edge
- Use decorative patterns, nature elements, abstract art, or elegant borders
- Suitable for professional printing on greeting card stock
- High-end, premium quality aesthetic

IMPORTANT EXCLUSIONS:
- NO people, faces, or human figures of any kind
- NO text, words, or letters
- NO logos or branding
- Focus entirely on decorative, abstract, or nature-based imagery

COMPOSITION:
- Full-page design with balanced visual weight
- Consider leaving subtle space in center or bottom third for future handwritten message
- Beautiful, cohesive, and complete card front design
`.trim();

        // Generate card front image using DALL-E
        const response = await openai.images.generate({
            model: 'dall-e-3',
            prompt: comprehensivePrompt,
            n: 1,
            size: '1024x1024',
            quality: 'standard',
        });

        const imageUrl = response.data?.[0]?.url;

        if (!imageUrl || !response.data) {
            return res.status(500).json({
                error: 'Failed to generate image'
            });
        }

        // Increment usage counter
        await prisma.userUsage.update({
            where: { userId },
            data: {
                imageGenerations: { increment: 1 },
            },
        });

        // Track event
        await trackEvent({
            userId,
            eventType: 'image_generated',
            metadata: {
                type: 'card_front',
                tone,
                occasion,
                hasImageAnalysis: !!imageAnalysis,
            },
        });

        return res.json({
            imageUrl,
            tone,
            occasion,
        });
    } catch (error: any) {
        console.error('Card image generation error:', error);
        return res.status(500).json({
            error: 'Failed to generate card image. Please try again.'
        });
    }
});

export default router;

