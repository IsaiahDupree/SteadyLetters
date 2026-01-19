import { prisma } from './prisma';

// Define tier limits
const TIER_LIMITS = {
    FREE: {
        letterGenerations: 5,
        imageGenerations: 3,
        lettersSent: 2,
    },
    PRO: {
        letterGenerations: 50,
        imageGenerations: 25,
        lettersSent: 20,
    },
    BUSINESS: {
        letterGenerations: 999999, // Unlimited
        imageGenerations: 100,
        lettersSent: 100,
    },
} as const;

type ActionType = 'letterGeneration' | 'imageGeneration' | 'letterSend';
type TierType = keyof typeof TIER_LIMITS;

function getUsageField(action: ActionType): string {
    switch (action) {
        case 'letterGeneration':
            return 'letterGenerations';
        case 'imageGeneration':
            return 'imageGenerations';
        case 'letterSend':
            return 'lettersSent';
    }
}

function getLimitField(action: ActionType): keyof typeof TIER_LIMITS.FREE {
    switch (action) {
        case 'letterGeneration':
            return 'letterGenerations';
        case 'imageGeneration':
            return 'imageGenerations';
        case 'letterSend':
            return 'lettersSent';
    }
}

export async function checkUsageLimit(
    userId: string,
    action: ActionType
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
    try {
        let usage = await prisma.userUsage.findUnique({
            where: { userId },
        });

        // Create usage record if doesn't exist
        if (!usage) {
            usage = await prisma.userUsage.create({
                data: {
                    userId,
                    tier: 'FREE',
                    resetAt: getNextResetDate(),
                },
            });
        }

        // Check if we need to reset (new billing cycle)
        if (new Date() >= usage.resetAt) {
            usage = await prisma.userUsage.update({
                where: { userId },
                data: {
                    letterGenerations: 0,
                    imageGenerations: 0,
                    lettersSent: 0,
                    resetAt: getNextResetDate(),
                },
            });
        }

        const tier = (usage.tier as TierType) || 'FREE';
        const limits = TIER_LIMITS[tier];
        const limitField = getLimitField(action);
        const limit = limits[limitField];

        const usageField = getUsageField(action);
        const currentUsage = (usage as any)[usageField] || 0;

        return {
            allowed: currentUsage < limit,
            remaining: Math.max(0, limit - currentUsage),
            limit,
        };
    } catch (error) {
        console.error('Error checking usage limit:', error);
        // Default to allowing if there's an error (fail open)
        return { allowed: true, remaining: 999, limit: 999 };
    }
}

export async function incrementUsage(
    userId: string,
    action: ActionType
): Promise<void> {
    try {
        const usageField = getUsageField(action);

        await prisma.userUsage.upsert({
            where: { userId },
            update: {
                [usageField]: { increment: 1 },
            },
            create: {
                userId,
                [usageField]: 1,
                tier: 'FREE',
                resetAt: getNextResetDate(),
            },
        });
    } catch (error) {
        console.error('Error incrementing usage:', error);
    }
}

export async function getUsageStats(userId: string) {
    try {
        const usage = await prisma.userUsage.findUnique({
            where: { userId },
        });

        if (!usage) {
            return {
                tier: 'FREE',
                letterGenerations: { used: 0, limit: TIER_LIMITS.FREE.letterGenerations },
                imageGenerations: { used: 0, limit: TIER_LIMITS.FREE.imageGenerations },
                lettersSent: { used: 0, limit: TIER_LIMITS.FREE.lettersSent },
                resetAt: getNextResetDate(),
            };
        }

        const tier = (usage.tier as TierType) || 'FREE';
        const limits = TIER_LIMITS[tier];

        return {
            tier,
            letterGenerations: { used: usage.letterGenerations, limit: limits.letterGenerations },
            imageGenerations: { used: usage.imageGenerations, limit: limits.imageGenerations },
            lettersSent: { used: usage.lettersSent, limit: limits.lettersSent },
            resetAt: usage.resetAt,
        };
    } catch (error) {
        console.error('Error getting usage stats:', error);
        return null;
    }
}

function getNextResetDate(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}

export { TIER_LIMITS };
