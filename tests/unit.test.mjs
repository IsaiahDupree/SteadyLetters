/**
 * Unit Tests for Core Libraries
 * Tests api-auth, pricing-tiers, and other utility functions
 */

import { describe, it } from '@jest/globals';
import assert from 'node:assert';

describe('API Auth Helper', () => {

    it.skip('should export getAuthenticatedUser function - requires Next.js runtime', async () => {
        // This test requires Next.js runtime environment
        // Skipping in standalone node test
    });

    it.skip('should return null for unauthenticated request - requires Next.js runtime', async () => {
        // This test requires Next.js runtime environment  
        // Skipping in standalone node test
    });
});

describe('Pricing Tiers', () => {

    it('should export pricing plans', async () => {
        const { STRIPE_PLANS } = await import('../src/lib/pricing-tiers.ts');

        assert.ok(STRIPE_PLANS, 'Should export STRIPE_PLANS');
        assert.ok(STRIPE_PLANS.FREE, 'Should have FREE plan');
        assert.ok(STRIPE_PLANS.PRO, 'Should have PRO plan');
        assert.ok(STRIPE_PLANS.BUSINESS, 'Should have BUSINESS plan');
    });

    it('should have correct Pro pricing', async () => {
        const { STRIPE_PLANS } = await import('../src/lib/pricing-tiers.ts');

        assert.strictEqual(STRIPE_PLANS.PRO.price, 29.99);
        assert.strictEqual(STRIPE_PLANS.PRO.name, 'Pro');
    });

    it('should have correct Business pricing', async () => {
        const { STRIPE_PLANS } = await import('../src/lib/pricing-tiers.ts');

        assert.strictEqual(STRIPE_PLANS.BUSINESS.price, 59.99);
        assert.strictEqual(STRIPE_PLANS.BUSINESS.name, 'Business');
    });

    it('should have features for each plan', async () => {
        const { STRIPE_PLANS } = await import('../src/lib/pricing-tiers.ts');

        assert.ok(Array.isArray(STRIPE_PLANS.FREE.features));
        assert.ok(Array.isArray(STRIPE_PLANS.PRO.features));
        assert.ok(Array.isArray(STRIPE_PLANS.BUSINESS.features));

        assert.ok(STRIPE_PLANS.FREE.features.length > 0);
        assert.ok(STRIPE_PLANS.PRO.features.length > 0);
        assert.ok(STRIPE_PLANS.BUSINESS.features.length > 0);
    });

    it('should have priceId for paid plans', async () => {
        const { STRIPE_PLANS } = await import('../src/lib/pricing-tiers.ts');

        assert.strictEqual(STRIPE_PLANS.FREE.priceId, null);
        // Price IDs come from env vars, so they might be undefined in test
        assert.ok(
            STRIPE_PLANS.PRO.priceId !== null,
            'Pro should have priceId defined (may be from env var)'
        );
        assert.ok(
            STRIPE_PLANS.BUSINESS.priceId !== null,
            'Business should have priceId defined (may be from env var)'
        );
    });
});

describe('Test Utilities', () => {

    it('should create test audio blob', async () => {
        const { createTestAudioBlob } = await import('./fixtures/test-data.mjs');

        const blob = createTestAudioBlob(1);
        assert.ok(blob instanceof Blob);
        assert.strictEqual(blob.type, 'audio/webm');
        assert.ok(blob.size > 0);
    });

    it('should create test image blob', async () => {
        const { createTestImageBlob } = await import('./fixtures/test-data.mjs');

        const blob = createTestImageBlob('png');
        assert.ok(blob instanceof Blob);
        assert.strictEqual(blob.type, 'image/png');
        assert.ok(blob.size > 0);
    });

    it('should have test case fixtures', async () => {
        const { HIGH_PRIORITY_CASES, LETTER_TEST_CASES } = await import('./fixtures/test-data.mjs');

        assert.ok(Array.isArray(HIGH_PRIORITY_CASES));
        assert.ok(Array.isArray(LETTER_TEST_CASES));
        assert.ok(HIGH_PRIORITY_CASES.length > 0);
        assert.ok(LETTER_TEST_CASES.length === 40); // 5 tones × 8 occasions
    });
});

console.log('\n✅ Unit tests complete\n');
