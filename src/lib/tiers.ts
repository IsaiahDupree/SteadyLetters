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
        lettersSent: 10, // Updated per tierresearch.txt
    },
    BUSINESS: {
        name: 'Business',
        letterGenerations: 200, // Updated per tierresearch.txt
        imageGenerations: 400, // Updated per tierresearch.txt
        lettersSent: 50, // Updated per tierresearch.txt
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
            return usage.letterGenerations < tier.letterGenerations;
        case 'image':
            return usage.imageGenerations < tier.imageGenerations;
        case 'send':
            return usage.lettersSent < tier.lettersSent;
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
        letters: `${usage.letterGenerations} / ${tier.letterGenerations}`,
        images: `${usage.imageGenerations} / ${tier.imageGenerations}`,
        sends: `${usage.lettersSent} / ${tier.lettersSent}`,
    };
}
