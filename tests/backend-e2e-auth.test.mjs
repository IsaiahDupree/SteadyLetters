/**
 * Comprehensive Backend E2E Tests with Authentication
 * 
 * ✅ MIGRATED TO PLAYWRIGHT: These tests now run via Playwright E2E framework.
 * 
 * Run authenticated API tests with:
 *   npx playwright test tests/e2e/backend-api-authenticated.spec.ts
 * 
 * This file serves as a redirect/reference for the Playwright implementation.
 */

import { describe, it, expect } from '@jest/globals';

describe('Authenticated Backend E2E Tests', () => {

    it('✅ Authenticated tests migrated to Playwright - see tests/e2e/backend-api-authenticated.spec.ts', () => {
        // These tests have been migrated to Playwright for proper cookie-based authentication
        // Run with: npx playwright test tests/e2e/backend-api-authenticated.spec.ts
        expect(true).toBe(true);
    });
});

console.log('\n✅ Backend E2E auth tests - migrated to Playwright (tests/e2e/backend-api-authenticated.spec.ts)\n');

/* Original tests moved to Playwright - keeping for reference:

    describe('Letter Generation API', () => {

        it('should generate letter with text input only', async () => {
            const response = await authenticatedPost(`${baseUrl}/api/generate/letter`, {
                context: 'Thanking my mentor for their guidance',
                tone: 'professional',
                occasion: 'thank-you',
            });

            assert.strictEqual(response.status, 200, 'Should return 200 OK');
            const data = await response.json();
            assert.ok(data.letter, 'Should return generated letter');
            assert.ok(data.letter.length > 50, 'Letter should have meaningful content');
        });

        it('should generate letter with image analysis input', async () => {
            // First analyze an image
            const formData = new FormData();
            const imageBlob = createTestImageBlob('jpg');
            formData.append('image', imageBlob, 'test-image.jpg');

            const analysisResponse = await authenticatedFormPost(`${baseUrl}/api/analyze-image`, formData);
            assert.strictEqual(analysisResponse.status, 200);
            const { analysis } = await analysisResponse.json();

            // Then generate letter using image analysis
            const letterResponse = await authenticatedPost(`${baseUrl}/api/generate/letter`, {
                context: 'A birthday card inspired by this image',
                tone: 'friendly',
                occasion: 'birthday',
                imageAnalysis: analysis,
            });

            assert.strictEqual(letterResponse.status, 200);
            const data = await letterResponse.json();
            assert.ok(data.letter, 'Should return generated letter');
        });

        it('should test all high-priority tone/occasion combinations', async () => {
            for (const testCase of HIGH_PRIORITY_CASES.slice(0, 5)) { // Test first 5 to save time
                const response = await authenticatedPost(`${baseUrl}/api/generate/letter`, {
                    context: testCase.context,
                    tone: testCase.tone,
                    occasion: testCase.occasion,
                    holiday: testCase.holiday,
                });

                assert.strictEqual(
                    response.status,
                    200,
                    `Should generate ${testCase.tone} ${testCase.occasion} letter`
                );
                const data = await response.json();
                assert.ok(data.letter, `Should return letter for ${testCase.tone}/${testCase.occasion}`);
            }
        });

        it('should enforce usage limits for Free tier', async () => {
            // This test would require resetting user usage in DB
            // For now, just check that limit enforcement code exists
            const responses = [];
            for (let i = 0; i < 6; i++) {
                const response = await authenticatedPost(`${baseUrl}/api/generate/letter`, {
                    context: `Test letter ${i}`,
                    tone: 'casual',
                    occasion: 'general',
                });
                responses.push(response);
            }

            // At least one should succeed (assuming not at limit yet)
            const successCount = responses.filter(r => r.status === 200).length;
            assert.ok(successCount > 0, 'Should allow some letter generations');
        });
    });

    describe('Voice Transcription API', () => {

        it('should transcribe audio file', async () => {
            const formData = new FormData();
            const audioBlob = createTestAudioBlob(1);
            formData.append('audio', audioBlob, 'test-audio.webm');

            const response = await authenticatedFormPost(`${baseUrl}/api/transcribe`, formData);

            // Note: Our test audio is minimal, so transcription might fail or return empty
            // In real test, use actual audio file
            assert.ok(
                response.status === 200 || response.status === 500,
                'Should attempt to transcribe'
            );
        });

        it('should reject oversized audio files', async () => {
            const formData = new FormData();
            // Create a large blob (>25MB)
            const largeBlob = new Blob([new ArrayBuffer(26 * 1024 * 1024)], { type: 'audio/webm' });
            formData.append('audio', largeBlob, 'large-audio.webm');

            const response = await authenticatedFormPost(`${baseUrl}/api/transcribe`, formData);

            assert.strictEqual(response.status, 400, 'Should reject oversized files');
            const data = await response.json();
            assert.ok(data.error.includes('too large'), 'Should mention file size');
        });

        it('should reject missing audio file', async () => {
            const formData = new FormData();
            const response = await authenticatedFormPost(`${baseUrl}/api/transcribe`, formData);

            assert.strictEqual(response.status, 400, 'Should reject missing file');
        });
    });

    describe('Image Analysis API', () => {

        it('should analyze image file', async () => {
            const formData = new FormData();
            const imageBlob = createTestImageBlob('png');
            formData.append('image', imageBlob, 'test-image.png');

            const response = await authenticatedFormPost(`${baseUrl}/api/analyze-image`, formData);

            assert.strictEqual(response.status, 200, 'Should return 200 OK');
            const data = await response.json();
            assert.ok(data.analysis, 'Should return analysis');
            assert.ok(data.analysis.length > 10, 'Analysis should have content');
        });

        it('should reject oversized images', async () => {
            const formData = new FormData();
            // Create a large blob (>20MB)
            const largeBlob = new Blob([new ArrayBuffer(21 * 1024 * 1024)], { type: 'image/jpeg' });
            formData.append('image', largeBlob, 'large-image.jpg');

            const response = await authenticatedFormPost(`${baseUrl}/api/analyze-image`, formData);

            assert.strictEqual(response.status, 400, 'Should reject oversized images');
        });

        it('should accept different image formats', async () => {
            for (const format of ['png', 'jpg']) {
                const formData = new FormData();
                const imageBlob = createTestImageBlob(format);
                formData.append('image', imageBlob, `test-image.${format}`);

                const response = await authenticatedFormPost(`${baseUrl}/api/analyze-image`, formData);
                assert.strictEqual(response.status, 200, `Should accept ${format}`);
            }
        });
    });

    describe('Stripe Payment API', () => {

        it('should create checkout session for Pro plan', async () => {
            const response = await authenticatedPost(`${baseUrl}/api/stripe/checkout`, {
                priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_test',
                userId: testSession.user.id,
                email: testSession.user.email,
            });

            // Should either succeed or fail with specific error
            assert.ok(
                response.status === 200 || response.status === 500,
                'Should attempt to create checkout session'
            );

            if (response.status === 200) {
                const data = await response.json();
                assert.ok(data.url, 'Should return checkout URL');
                assert.ok(data.url.includes('stripe.com'), 'Should be Stripe URL');
            }
        });

        it('should create checkout session for Business plan', async () => {
            const response = await authenticatedPost(`${baseUrl}/api/stripe/checkout`, {
                priceId: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID || 'price_test',
                userId: testSession.user.id,
                email: testSession.user.email,
            });

            assert.ok(
                response.status === 200 || response.status === 500,
                'Should attempt to create checkout session'
            );
        });

        it('should reject checkout without required fields', async () => {
            const response = await authenticatedPost(`${baseUrl}/api/stripe/checkout`, {
                // Missing priceId, userId, email
            });

            assert.strictEqual(response.status, 400, 'Should reject missing fields');
            const data = await response.json();
            assert.ok(data.error, 'Should return error message');
        });
    });

    describe('Letter Tracking & Status', () => {

        it('should create order and track status', async () => {
            // First, generate a letter
            const letterResponse = await authenticatedPost(`${baseUrl}/api/generate/letter`, {
                context: 'Test letter for tracking',
                tone: 'casual',
                occasion: 'general',
            });

            assert.strictEqual(letterResponse.status, 200);
            const { letter } = await letterResponse.json();

            // Then, create an order (this would go to /api/orders endpoint)
            const orderResponse = await authenticatedPost(`${baseUrl}/api/orders`, {
                recipientId: 'test-recipient-id', // Would need real recipient
                content: letter,
                status: 'draft',
            });

            // Check if orders endpoint exists
            if (orderResponse.status === 404) {
                console.log('⚠️  Orders API endpoint not yet implemented');
                return;
            }

            assert.ok(
                orderResponse.status === 200 || orderResponse.status === 201,
                'Should create order'
            );
        });

        it('should track letter through statuses: draft → pending → sent → delivered', async () => {
            // This test assumes an orders API exists
            // Would test status transitions
            const statuses = ['draft', 'pending', 'sent', 'delivered'];

            // For now, just verify the concept works
            assert.ok(statuses.length === 4, 'Should have 4 status stages');
        });
    });

    describe('Combined Workflow Tests', () => {

        it('should complete full workflow: voice → letter → mail', async () => {
            // 1. Transcribe voice
            const audioFormData = new FormData();
            const audioBlob = createTestAudioBlob(1);
            audioFormData.append('audio', audioBlob, 'voice.webm');

            const transcribeResponse = await authenticatedFormPost(`${baseUrl}/api/transcribe`, audioFormData);
            // May fail with test audio
            const transcriptionText = transcribeResponse.status === 200
                ? (await transcribeResponse.json()).text
                : VOICE_TEST_CONTEXT;

            // 2. Generate letter
            const letterResponse = await authenticatedPost(`${baseUrl}/api/generate/letter`, {
                context: transcriptionText,
                tone: 'friendly',
                occasion: 'general',
            });

            assert.strictEqual(letterResponse.status, 200);
            const { letter } = await letterResponse.json();

            // 3. (Would send to mail API)
            assert.ok(letter, 'Should complete workflow to letter generation');
        });

        it('should complete full workflow: image → letter → mail', async () => {
            // 1. Analyze image
            const imageFormData = new FormData();
            const imageBlob = createTestImageBlob('jpg');
            imageFormData.append('image', imageBlob, 'photo.jpg');

            const analysisResponse = await authenticatedFormPost(`${baseUrl}/api/analyze-image`, imageFormData);
            assert.strictEqual(analysisResponse.status, 200);
            const { analysis } = await analysisResponse.json();

            // 2. Generate letter with image context
            const letterResponse = await authenticatedPost(`${baseUrl}/api/generate/letter`, {
                context: IMAGE_TEST_CONTEXT,
                tone: 'heartfelt',
                occasion: 'birthday',
                imageAnalysis: analysis,
            });

            assert.strictEqual(letterResponse.status, 200);
            const { letter } = await letterResponse.json();
            assert.ok(letter, 'Should generate letter with image analysis');
        });
    });

    describe('Unauthenticated Access Tests', () => {

        it('should reject unauthenticated letter generation', async () => {
            const response = await fetch(`${baseUrl}/api/generate/letter`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    context: 'Test',
                    tone: 'casual',
                    occasion: 'general',
                }),
            });

            assert.strictEqual(response.status, 401, 'Should reject unauthenticated request');
        });

        it('should reject unauthenticated transcription', async () => {
            const formData = new FormData();
            formData.append('audio', createTestAudioBlob(), 'test.webm');

            const response = await fetch(`${baseUrl}/api/transcribe`, {
                method: 'POST',
                body: formData,
            });

            assert.strictEqual(response.status, 401, 'Should reject unauthenticated request');
        });

        it('should reject unauthenticated image analysis', async () => {
            const formData = new FormData();
            formData.append('image', createTestImageBlob(), 'test.jpg');

            const response = await fetch(`${baseUrl}/api/analyze-image`, {
                method: 'POST',
                body: formData,
            });

            assert.strictEqual(response.status, 401, 'Should reject unauthenticated request');
        });
    });
});

// End of original tests - now in Playwright
*/
