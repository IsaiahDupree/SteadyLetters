import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { STRIPE_PLANS } from '../../lib/pricing-tiers';
import { authenticateRequest } from '../../middleware/auth';

const router = Router();

/**
 * GET /api/billing/usage
 * Get current user's usage and subscription data
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
            include: {
                usage: true,
            },
        });

        // Get or create usage record
        let usage = dbUser.usage;
        if (!usage) {
            // Calculate next month's reset date (1st of next month)
            const now = new Date();
            const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

            usage = await prisma.userUsage.upsert({
                where: { userId: user.id },
                update: {},
                create: {
                    userId: user.id,
                    tier: 'FREE',
                    resetAt: nextMonth,
                },
            });
        }

        // Calculate accurate reset date if it's in the past or needs updating
        let resetDate = usage.resetAt;
        const now = new Date();

        // If reset date is in the past, calculate next month's reset
        if (resetDate < now) {
            const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            resetDate = nextMonth;

            // Update the database with the new reset date
            await prisma.userUsage.update({
                where: { id: usage.id },
                data: { resetAt: resetDate },
            });
        }

        // Get tier limits from STRIPE_PLANS
        const planKey = usage.tier as keyof typeof STRIPE_PLANS;
        const plan = STRIPE_PLANS[planKey] || STRIPE_PLANS.FREE;

        // Helper to parse limit string
        const getLimits = (tierName: string) => {
            if (tierName === 'BUSINESS') {
                return {
                    letters: 200,
                    images: 400,
                    sends: 50,
                    voice: -1, // Unlimited
                    analysis: -1 // Unlimited
                };
            } else if (tierName === 'PRO') {
                return {
                    letters: 50,
                    images: 100,
                    sends: 10,
                    voice: -1,
                    analysis: -1
                };
            } else {
                // FREE
                return {
                    letters: 5,
                    images: 10,
                    sends: 3,
                    voice: 5,
                    analysis: 5
                };
            }
        };

        const limits = getLimits(usage.tier);

        // Calculate usage stats
        const calculatePercentage = (used: number, limit: number) => {
            if (limit === -1) return 0;
            return Math.min(100, (used / limit) * 100);
        };

        const usageStats = {
            letterGenerations: {
                used: usage.letterGenerations,
                limit: limits.letters,
                percentage: calculatePercentage(usage.letterGenerations, limits.letters),
            },
            imageGenerations: {
                used: usage.imageGenerations,
                limit: limits.images,
                percentage: calculatePercentage(usage.imageGenerations, limits.images),
            },
            lettersSent: {
                used: usage.lettersSent,
                limit: limits.sends,
                percentage: calculatePercentage(usage.lettersSent, limits.sends),
            },
            voiceTranscriptions: {
                used: usage.voiceTranscriptions,
                limit: limits.voice,
                percentage: calculatePercentage(usage.voiceTranscriptions, limits.voice),
            },
            imageAnalyses: {
                used: usage.imageAnalyses,
                limit: limits.analysis,
                percentage: calculatePercentage(usage.imageAnalyses, limits.analysis),
            },
        };

        // Get subscription info
        const subscription = {
            tier: usage.tier,
            status: dbUser.stripeSubscriptionId ? 'active' : 'free',
            currentPeriodEnd: dbUser.stripeCurrentPeriodEnd,
            stripePriceId: dbUser.stripePriceId,
        };

        return res.json({
            subscription,
            usage: usageStats,
            resetAt: resetDate,
        });
    } catch (error: any) {
        console.error('Get usage error:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            name: error.name,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        });
        
        const errorMessage = process.env.NODE_ENV === 'development'
            ? error.message || 'Failed to fetch usage data'
            : 'Failed to fetch usage data';
        
        return res.status(500).json({
            error: errorMessage,
            ...(process.env.NODE_ENV === 'development' && { 
                details: error.message,
                code: error.code,
            })
        });
    }
});

export default router;

