import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { STRIPE_PLANS } from '@/lib/pricing-tiers';

/**
 * GET /api/billing/usage
 * Get current user's usage and subscription data
 */
export async function GET(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser(request);

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get user with subscription and usage data
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: {
                usage: true,
            },
        });

        if (!dbUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Get or create usage record
        let usage = dbUser.usage;
        if (!usage) {
            // Calculate next month's reset date (1st of next month)
            const now = new Date();
            const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

            usage = await prisma.userUsage.create({
                data: {
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

        // Helper to parse limit string (e.g. "5 AI letter generations/month")
        // This is a bit fragile but works for now since we don't have structured limits in STRIPE_PLANS features array
        // Ideally STRIPE_PLANS should have a 'limits' object. 
        // For now, we'll hardcode the mapping based on the plan name to match pricing-tiers.ts logic

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
            // Proxies for now as DB schema update is pending
            voiceTranscriptions: {
                used: usage.letterGenerations,
                limit: limits.voice,
                percentage: calculatePercentage(usage.letterGenerations, limits.voice),
            },
            imageAnalyses: {
                used: usage.imageGenerations,
                limit: limits.analysis,
                percentage: calculatePercentage(usage.imageGenerations, limits.analysis),
            },
        };

        // Get subscription info
        const subscription = {
            tier: usage.tier,
            status: dbUser.stripeSubscriptionId ? 'active' : 'free',
            currentPeriodEnd: dbUser.stripeCurrentPeriodEnd,
            stripePriceId: dbUser.stripePriceId,
        };

        return NextResponse.json({
            subscription,
            usage: usageStats,
            resetAt: resetDate,
        });
    } catch (error: any) {
        console.error('Get usage error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch usage data' },
            { status: 500 }
        );
    }
}

