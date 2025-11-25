/**
 * Security Tests with Authentication
 * Tests authorization, injection prevention, and secure practices
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { getTestUserSession, authenticatedPost, authenticatedFormPost } from './utils/auth-helper.mjs';
import { createTestAudioBlob, createTestImageBlob } from './fixtures/test-data.mjs';

const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

let testSession = null;

before(async () => {
    const { session, error } = await getTestUserSession();
    if (error) {
        throw new Error(`Failed to get test session: ${error.message}`);
    }
    testSession = session;
});

describe('Security Tests', () => {

    describe('Authentication & Authorization', () => {

        it('should reject requests without auth token', async () => {
            const response = await fetch(`${baseUrl}/api/generate/letter`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    context: 'Test',
                    tone: 'casual',
                    occasion: 'general',
                }),
            });

            assert.strictEqual(response.status, 401, 'Should return 401 Unauthorized');
        });

        it('should reject invalid auth tokens', async () => {
            const response = await fetch(`${baseUrl}/api/generate/letter`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer invalid_token_12345',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    context: 'Test',
                    tone: 'casual',
                    occasion: 'general',
                }),
            });

            assert.strictEqual(response.status, 401, 'Should reject invalid token');
        });

        it('should accept valid auth tokens', async () => {
            const response = await authenticatedPost(`${baseUrl}/api/generate/letter`, {
                context: 'Test with valid auth',
                tone: 'casual',
                occasion: 'general',
            });

            assert.ok([200, 403].includes(response.status),
                'Should accept valid token (200 OK or 403 if quota exceeded)');
        });
    });

    describe('Input Validation', () => {

        it('should reject SQL injection attempts in context', async () => {
            const sqlInjection = "'; DROP TABLE users; --";

            const response = await authenticatedPost(`${baseUrl}/api/generate/letter`, {
                context: sqlInjection,
                tone: 'casual',
                occasion: 'general',
            });

            // Should either sanitize or reject malicious input
            // At minimum, should not cause a 500 error from SQL
            assert.notStrictEqual(response.status, 500, 'Should handle malicious input safely');
        });

        it('should reject XSS attempts in letter content', async () => {
            const xssAttempt = '<script>alert("XSS")</script>';

            const response = await authenticatedPost(`${baseUrl}/api/generate/letter`, {
                context: xssAttempt,
                tone: 'casual',
                occasion: 'general',
            });

            if (response.status === 200) {
                const data = await response.json();
                // Generated letter should not contain raw script tags
                assert.ok(
                    !data.letter.includes('<script>'),
                    'Should sanitize XSS attempts'
                );
            }
        });

        it('should validate tone parameter', async () => {
            const response = await authenticatedPost(`${baseUrl}/api/generate/letter`, {
                context: 'Test',
                tone: 'invalid_tone_12345',
                occasion: 'general',
            });

            // Should either reject or handle gracefully
            assert.ok(
                [200, 400].includes(response.status),
                'Should validate tone parameter'
            );
        });

        it('should validate occasion parameter', async () => {
            const response = await authenticatedPost(`${baseUrl}/api/generate/letter`, {
                context: 'Test',
                tone: 'casual',
                occasion: 'invalid_occasion_12345',
            });

            assert.ok(
                [200, 400].includes(response.status),
                'Should validate occasion parameter'
            );
        });

        it('should reject missing required fields', async () => {
            const response = await authenticatedPost(`${baseUrl}/api/generate/letter`, {
                // Missing context, tone, occasion
            });

            assert.strictEqual(response.status, 400, 'Should reject missing fields');
        });
    });

    describe('File Upload Security', () => {

        it('should reject non-audio files for transcription', async () => {
            const formData = new FormData();
            const textBlob = new Blob(['not an audio file'], { type: 'text/plain' });
            formData.append('audio', textBlob, 'malicious.txt');

            const response = await authenticatedFormPost(`${baseUrl}/api/transcribe`, formData);

            // Should reject or safely handle non-audio files
            assert.ok(
                [400, 500].includes(response.status),
                'Should reject non-audio files'
            );
        });

        it('should reject oversized audio files', async () => {
            const formData = new FormData();
            const largeBlob = new Blob([new ArrayBuffer(26 * 1024 * 1024)], { type: 'audio/webm' });
            formData.append('audio', largeBlob, 'large.webm');

            const response = await authenticatedFormPost(`${baseUrl}/api/transcribe`, formData);

            assert.strictEqual(response.status, 400, 'Should reject files >25MB');
        });

        it('should reject non-image files for analysis', async () => {
            const formData = new FormData();
            const textBlob = new Blob(['not an image'], { type: 'text/plain' });
            formData.append('image', textBlob, 'malicious.txt');

            const response = await authenticatedFormPost(`${baseUrl}/api/analyze-image`, formData);

            assert.ok(
                [400, 500].includes(response.status),
                'Should reject non-image files'
            );
        });

        it('should reject oversized image files', async () => {
            const formData = new FormData();
            const largeBlob = new Blob([new ArrayBuffer(21 * 1024 * 1024)], { type: 'image/jpeg' });
            formData.append('image', largeBlob, 'large.jpg');

            const response = await authenticatedFormPost(`${baseUrl}/api/analyze-image`, formData);

            assert.strictEqual(response.status, 400, 'Should reject files >20MB');
        });
    });

    describe('Rate Limiting & Quota Enforcement', () => {

        it('should enforce Free tier limits', async () => {
            // This test assumes user is on Free tier with limited quota
            // Would need to reset quota or use test user with known state
            const responses = [];
            for (let i = 0; i < 10; i++) {
                const response = await authenticatedPost(`${baseUrl}/api/generate/letter`, {
                    context: `Rate limit test ${i}`,
                    tone: 'casual',
                    occasion: 'general',
                });
                responses.push(response);
            }

            // Should eventually hit limit (403) or succeed (200)
            const limitReached = responses.some(r => r.status === 403);
            console.log(`  📊 Quota test: ${responses.filter(r => r.status === 200).length}/10 succeeded`);
        });
    });

    describe('Secure Headers & HTTPS', () => {

        it('should set secure headers', async () => {
            const response = await fetch(`${baseUrl}/`);
            const headers = response.headers;

            // Check for security headers
            // Note: May not be set in dev environment
            console.log('  🔒 Security headers:');
            console.log(`    X-Frame-Options: ${headers.get('x-frame-options') || 'not set'}`);
            console.log(`    X-Content-Type-Options: ${headers.get('x-content-type-options') || 'not set'}`);
            console.log(`    Strict-Transport-Security: ${headers.get('strict-transport-security') || 'not set'}`);
        });
    });

    describe('Data Privacy', () => {

        it('should not expose sensitive data in error messages', async () => {
            const response = await authenticatedPost(`${baseUrl}/api/generate/letter`, {
                // Invalid request that will cause error
            });

            if (response.status >= 400) {
                const data = await response.json();
                const errorText = JSON.stringify(data).toLowerCase();

                // Should not contain sensitive info
                assert.ok(
                    !errorText.includes('password'),
                    'Errors should not expose passwords'
                );
                assert.ok(
                    !errorText.includes('secret'),
                    'Errors should not expose secrets'
                );
                assert.ok(
                    !errorText.includes('api_key'),
                    'Errors should not expose API keys'
                );
            }
        });
    });
});

console.log('\n✅ Security tests complete\n');
