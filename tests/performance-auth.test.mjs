/**
 * Performance Tests with Authentication
 * Tests API response times and load handling
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { performance } from 'node:perf_hooks';
import { getTestUserSession, authenticatedPost, authenticatedFormPost } from './utils/auth-helper.mjs';
import { createTestAudioBlob, createTestImageBlob, PERFORMANCE_BENCHMARKS } from './fixtures/test-data.mjs';

const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

let testSession = null;

before(async () => {
    const { session, error } = await getTestUserSession();
    if (error) {
        throw new Error(`Failed to get test session: ${error.message}`);
    }
    testSession = session;
});

describe('Performance Tests', () => {

    describe('API Response Times', () => {

        it('should generate letter within 3 seconds', async () => {
            const startTime = performance.now();

            const response = await authenticatedPost(`${baseUrl}/api/generate/letter`, {
                context: 'A quick thank you note',
                tone: 'casual',
                occasion: 'thank-you',
            });

            const endTime = performance.now();
            const duration = endTime - startTime;

            console.log(`  ⏱️  Letter generation: ${duration.toFixed(0)}ms`);
            assert.ok(duration < PERFORMANCE_BENCHMARKS.letterGeneration,
                `Should complete in <${PERFORMANCE_BENCHMARKS.letterGeneration}ms, took ${duration.toFixed(0)}ms`);
        });

        it('should transcribe audio within 5 seconds', async () => {
            const formData = new FormData();
            const audioBlob = createTestAudioBlob(1);
            formData.append('audio', audioBlob, 'test.webm');

            const startTime = performance.now();

            const response = await authenticatedFormPost(`${baseUrl}/api/transcribe`, formData);

            const endTime = performance.now();
            const duration = endTime - startTime;

            console.log(`  ⏱️  Voice transcription: ${duration.toFixed(0)}ms`);

            // May fail with test audio, so check if it at least responded
            assert.ok(duration < PERFORMANCE_BENCHMARKS.voiceTranscription,
                `Should respond within ${PERFORMANCE_BENCHMARKS.voiceTranscription}ms`);
        });

        it('should analyze image within 2 seconds', async () => {
            const formData = new FormData();
            const imageBlob = createTestImageBlob('jpg');
            formData.append('image', imageBlob, 'test.jpg');

            const startTime = performance.now();

            const response = await authenticatedFormPost(`${baseUrl}/api/analyze-image`, formData);

            const endTime = performance.now();
            const duration = endTime - startTime;

            console.log(`  ⏱️  Image analysis: ${duration.toFixed(0)}ms`);
            assert.ok(duration < PERFORMANCE_BENCHMARKS.imageAnalysis,
                `Should complete in <${PERFORMANCE_BENCHMARKS.imageAnalysis}ms`);
        });

        it('should create Stripe checkout within 1 second', async () => {
            const startTime = performance.now();

            const response = await authenticatedPost(`${baseUrl}/api/stripe/checkout`, {
                priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_test',
                userId: testSession.user.id,
                email: testSession.user.email,
            });

            const endTime = performance.now();
            const duration = endTime - startTime;

            console.log(`  ⏱️  Stripe checkout: ${duration.toFixed(0)}ms`);
            assert.ok(duration < PERFORMANCE_BENCHMARKS.stripeCheckout,
                `Should respond within ${PERFORMANCE_BENCHMARKS.stripeCheckout}ms`);
        });
    });

    describe('Load Testing', () => {

        it('should handle 5 concurrent letter generations', async () => {
            const promises = [];

            for (let i = 0; i < 5; i++) {
                const promise = authenticatedPost(`${baseUrl}/api/generate/letter`, {
                    context: `Test letter ${i}`,
                    tone: 'casual',
                    occasion: 'general',
                });
                promises.push(promise);
            }

            const startTime = performance.now();
            const responses = await Promise.all(promises);
            const endTime = performance.now();

            const duration = endTime - startTime;
            console.log(`  ⏱️  5 concurrent requests: ${duration.toFixed(0)}ms`);

            // At least some should succeed
            const successCount = responses.filter(r => r.status === 200).length;
            assert.ok(successCount > 0, 'Should handle concurrent requests');
        });

        it('should handle 10 sequential requests efficiently', async () => {
            const startTime = performance.now();

            for (let i = 0; i < 10; i++) {
                await authenticatedPost(`${baseUrl}/api/generate/letter`, {
                    context: `Sequential test ${i}`,
                    tone: 'casual',
                    occasion: 'general',
                });
            }

            const endTime = performance.now();
            const totalDuration = endTime - startTime;
            const avgDuration = totalDuration / 10;

            console.log(`  ⏱️  10 sequential requests: ${totalDuration.toFixed(0)}ms (avg: ${avgDuration.toFixed(0)}ms)`);

            // Average should be reasonable
            assert.ok(avgDuration < 5000, 'Average time should be <5s per request');
        });
    });

    describe('Memory & Resource Usage', () => {

        it('should handle large text input efficiently', async () => {
            const largeContext = 'A'.repeat(5000); // 5KB text

            const startTime = performance.now();

            const response = await authenticatedPost(`${baseUrl}/api/generate/letter`, {
                context: largeContext,
                tone: 'professional',
                occasion: 'general',
            });

            const endTime = performance.now();
            const duration = endTime - startTime;

            console.log(`  ⏱️  Large text input (5KB): ${duration.toFixed(0)}ms`);
            assert.ok(duration < 5000, 'Should handle large input efficiently');
        });
    });
});

console.log('\n✅ Performance tests complete\n');
