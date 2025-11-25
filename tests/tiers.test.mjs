import { describe, it, expect } from '@jest/globals';

// Mock the pricing tiers for testing
const TIERS = {
    FREE: {
        name: 'Free',
        letterGenerations: 5,
        imageGenerations: 10,
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
        letterGenerations: -1,
        imageGenerations: -1,
        lettersSent: 100,
    },
};

function canGenerate(usage, type) {
    const tier = TIERS[usage.tier] || TIERS.FREE;

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

function getRemainingUsage(usage) {
    const tier = TIERS[usage.tier] || TIERS.FREE;

    return {
        letters: tier.letterGenerations === -1 ? 'Unlimited' : `${usage.letterGenerations} / ${tier.letterGenerations}`,
        images: tier.imageGenerations === -1 ? 'Unlimited' : `${usage.imageGenerations} / ${tier.imageGenerations}`,
        sends: tier.lettersSent === -1 ? 'Unlimited' : `${usage.lettersSent} / ${tier.lettersSent}`,
    };
}


describe('Pricing Tiers', () => {
    it('should define FREE tier limits', () => {
        expect(TIERS.FREE.letterGenerations).toBe(5);
        expect(TIERS.FREE.imageGenerations).toBe(10);
        expect(TIERS.FREE.lettersSent).toBe(3);
    });

    it('should define PRO tier limits', () => {
        expect(TIERS.PRO.letterGenerations).toBe(50);
        expect(TIERS.PRO.imageGenerations).toBe(100);
        expect(TIERS.PRO.lettersSent).toBe(25);
    });

    it('should define BUSINESS tier with unlimited generations', () => {
        expect(TIERS.BUSINESS.letterGenerations).toBe(-1);
        expect(TIERS.BUSINESS.imageGenerations).toBe(-1);
        expect(TIERS.BUSINESS.lettersSent).toBe(100);
    });
});

describe('canGenerate', () => {
    it('should allow generation when under FREE tier limit', () => {
        const usage = {
            letterGenerations: 2,
            imageGenerations: 5,
            lettersSent: 1,
            tier: 'FREE',
        };

        expect(canGenerate(usage, 'letter')).toBe(true);
        expect(canGenerate(usage, 'image')).toBe(true);
        expect(canGenerate(usage, 'send')).toBe(true);
    });

    it('should deny generation when at FREE tier limit', () => {
        const usage = {
            letterGenerations: 5,
            imageGenerations: 10,
            lettersSent: 3,
            tier: 'FREE',
        };

        expect(canGenerate(usage, 'letter')).toBe(false);
        expect(canGenerate(usage, 'image')).toBe(false);
        expect(canGenerate(usage, 'send')).toBe(false);
    });

    it('should always allow generation for BUSINESS tier with unlimited', () => {
        const usage = {
            letterGenerations: 1000,
            imageGenerations: 1000,
            lettersSent: 50,
            tier: 'BUSINESS',
        };

        expect(canGenerate(usage, 'letter')).toBe(true);
        expect(canGenerate(usage, 'image')).toBe(true);
        expect(canGenerate(usage, 'send')).toBe(true);
    });
});

describe('getRemainingUsage', () => {
    it('should show correct remaining usage for FREE tier', () => {
        const usage = {
            letterGenerations: 2,
            imageGenerations: 5,
            lettersSent: 1,
            tier: 'FREE',
        };

        const remaining = getRemainingUsage(usage);
        expect(remaining.letters).toBe('2 / 5');
        expect(remaining.images).toBe('5 / 10');
        expect(remaining.sends).toBe('1 / 3');
    });

    it('should show Unlimited for BUSINESS tier', () => {
        const usage = {
            letterGenerations: 100,
            imageGenerations: 200,
            lettersSent: 50,
            tier: 'BUSINESS',
        };

        const remaining = getRemainingUsage(usage);
        expect(remaining.letters).toBe('Unlimited');
        expect(remaining.images).toBe('Unlimited');
        expect(remaining.sends).toBe('50 / 100');
    });
});
