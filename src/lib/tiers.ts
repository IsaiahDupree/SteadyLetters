export const TIERS = {
    FREE: {
        name: 'Free',
        letterGenerations: 5,
        imageGenerations: 10, // 10 images = ~2-3 generation cycles (4 images per cycle)
        lettersSent: 3,
    },
    PRO: {
        name: 'Pro',
        letterGenerations: 50,
        imageGenerations: 100,
        lettersSent: 25,
    },
    BUSINESS: {
        name: 'Business',
        letterGenerations: -1, // unlimited
        imageGenerations: -1, // unlimited
        lettersSent: 100,
    },
} as const;

export type TierName = keyof typeof TIERS;

export function canGenerate(usage: {
    letterGenerations: number;
    imageGenerations: number;
    lettersSent: number;
    tier: string;
}, type: 'letter' | 'image' | 'send'): boolean {
    const tier = TIERS[usage.tier as TierName] || TIERS.FREE;

    switch (type) {
        case 'letter':
            return tier.letterGenerations === -1 || usage.letterGenerations < tier.letterGenerations;
        case 'image':
            return tier.imageGenerations === -1 || usage.imageGenerations < tier.imageGenerations;
        case 'send':
            return tier.lettersSent === -1 || usage.lettersSent < tier.lettersSent;
        default:
            return false;
    }
}

export function getRemainingUsage(usage: {
    letterGenerations: number;
    imageGenerations: number;
    lettersSent: number;
    tier: string;
}) {
    const tier = TIERS[usage.tier as TierName] || TIERS.FREE;

    return {
        letters: tier.letterGenerations === -1 ? 'Unlimited' : `${usage.letterGenerations} / ${tier.letterGenerations}`,
        images: tier.imageGenerations === -1 ? 'Unlimited' : `${usage.imageGenerations} / ${tier.imageGenerations}`,
        sends: tier.lettersSent === -1 ? 'Unlimited' : `${usage.lettersSent} / ${tier.lettersSent}`,
    };
}
