import { Router, Request, Response } from 'express';
import { generateLetterContent } from '../../lib/openai';
import { prisma } from '../../lib/prisma';
import { canGenerate } from '../../lib/tiers';
import { trackEvent } from '../../lib/events';
import { authenticateRequest } from '../../middleware/auth';

const router = Router();

router.post('/', authenticateRequest, async (req: Request, res: Response) => {
    try {
        // Get authenticated user (from middleware)
        const user = (req as any).user;

        if (!user) {
            return res.status(401).json({
                error: 'Unauthorized. Please sign in to generate letters.'
            });
        }

        const { context, tone, occasion, holiday, imageAnalysis, length } = req.body;

        if (!context || !tone || !occasion) {
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

        // Check if user can generate
        if (!canGenerate(usage, 'letter')) {
            // Track limit reached event
            await trackEvent({
                userId,
                eventType: 'limit_reached',
                metadata: { type: 'letter_generation', tier: usage.tier },
            });

            return res.status(403).json({
                error: 'You have reached your letter generation limit. Please upgrade your plan.'
            });
        }

        // Generate letter using OpenAI
        const letter = await generateLetterContent({
            context,
            tone,
            occasion,
            holiday,
            imageAnalysis,
            length,
        });

        // Increment usage counter
        await prisma.userUsage.update({
            where: { userId },
            data: {
                letterGenerations: { increment: 1 },
            },
        });

        // Track successful generation
        await trackEvent({
            userId,
            eventType: 'letter_generated',
            metadata: { tone, occasion, holiday: holiday || null },
        });

        return res.json({ letter });
    } catch (error: any) {
        console.error('Failed to generate letter:', error);
        
        // Provide more detailed error in development
        const errorMessage = process.env.NODE_ENV === 'development'
            ? error.message || 'Failed to generate letter'
            : 'Failed to generate letter. Please try again.';
        
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

