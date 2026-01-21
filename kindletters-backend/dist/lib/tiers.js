"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TIERS = void 0;
exports.canGenerate = canGenerate;
exports.getRemainingUsage = getRemainingUsage;
exports.TIERS = {
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
};
function canGenerate(usage, type) {
    const tier = exports.TIERS[usage.tier] || exports.TIERS.FREE;
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
function getRemainingUsage(usage) {
    const tier = exports.TIERS[usage.tier] || exports.TIERS.FREE;
    return {
        letters: `${usage.letterGenerations} / ${tier.letterGenerations}`,
        images: `${usage.imageGenerations} / ${tier.imageGenerations}`,
        sends: `${usage.lettersSent} / ${tier.lettersSent}`,
    };
}
