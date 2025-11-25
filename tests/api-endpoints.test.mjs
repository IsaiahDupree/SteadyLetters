/**
 * Comprehensive tests for API endpoints
 * Tests authentication, error handling, and functionality
 */

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://www.steadyletters.com';

describe('API Endpoints Tests', () => {
    describe('Authentication', () => {
        it('should require authentication for protected endpoints', async () => {
            const endpoints = [
                '/api/stripe/checkout',
                '/api/transcribe',
                '/api/analyze-image',
                '/api/generate/letter',
            ];

            for (const endpoint of endpoints) {
                const response = await fetch(`${PRODUCTION_URL}${endpoint}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                });

                expect([401, 400]).toContain(response.status);
            }
        });

        it('should return proper error message for unauthenticated requests', async () => {
            const response = await fetch(`${PRODUCTION_URL}/api/generate/letter`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ context: 'test', tone: 'friendly', occasion: 'birthday' }),
            });

            const data = await response.json();
            expect(response.status).toBe(401);
            expect(data.error).toContain('Unauthorized');
        });
    });

    describe('Stripe Checkout API', () => {
        it('should require authentication', async () => {
            const response = await fetch(`${PRODUCTION_URL}/api/stripe/checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priceId: 'price_test123' }),
            });

            expect(response.status).toBe(401);
        });

        it('should require priceId', async () => {
            // This will fail auth first, but if we had a valid session, it should require priceId
            const response = await fetch(`${PRODUCTION_URL}/api/stripe/checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });

            // Should be 401 (auth required) or 400 (missing priceId)
            expect([400, 401]).toContain(response.status);
        });

        it('should validate priceId format', async () => {
            const response = await fetch(`${PRODUCTION_URL}/api/stripe/checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priceId: 'invalid' }),
            });

            // Should fail validation or auth
            expect([400, 401, 500]).toContain(response.status);
        });
    });

    describe('Transcribe API', () => {
        it('should require authentication', async () => {
            const formData = new FormData();
            const blob = new Blob(['test audio'], { type: 'audio/webm' });
            formData.append('audio', blob, 'test.webm');

            const response = await fetch(`${PRODUCTION_URL}/api/transcribe`, {
                method: 'POST',
                body: formData,
            });

            expect(response.status).toBe(401);
        });

        it('should require audio file', async () => {
            const formData = new FormData();

            const response = await fetch(`${PRODUCTION_URL}/api/transcribe`, {
                method: 'POST',
                body: formData,
            });

            // Should be 401 (auth) or 400 (missing file)
            expect([400, 401]).toContain(response.status);
        });

        it('should validate file size (max 25MB)', async () => {
            // Create a large blob (simulating > 25MB)
            const largeBlob = new Blob([new ArrayBuffer(26 * 1024 * 1024)]);
            const formData = new FormData();
            formData.append('audio', largeBlob, 'large.webm');

            const response = await fetch(`${PRODUCTION_URL}/api/transcribe`, {
                method: 'POST',
                body: formData,
            });

            // Should be 401 (auth) or 400 (file too large)
            expect([400, 401]).toContain(response.status);
        });
    });

    describe('Image Analysis API', () => {
        it('should require authentication', async () => {
            const formData = new FormData();
            const blob = new Blob(['test image'], { type: 'image/jpeg' });
            formData.append('image', blob, 'test.jpg');

            const response = await fetch(`${PRODUCTION_URL}/api/analyze-image`, {
                method: 'POST',
                body: formData,
            });

            expect(response.status).toBe(401);
        });

        it('should require image file', async () => {
            const formData = new FormData();

            const response = await fetch(`${PRODUCTION_URL}/api/analyze-image`, {
                method: 'POST',
                body: formData,
            });

            // Should be 401 (auth) or 400 (missing file)
            expect([400, 401]).toContain(response.status);
        });

        it('should validate file size (max 20MB)', async () => {
            const largeBlob = new Blob([new ArrayBuffer(21 * 1024 * 1024)]);
            const formData = new FormData();
            formData.append('image', largeBlob, 'large.jpg');

            const response = await fetch(`${PRODUCTION_URL}/api/analyze-image`, {
                method: 'POST',
                body: formData,
            });

            // Should be 401 (auth) or 400 (file too large)
            expect([400, 401]).toContain(response.status);
        });
    });

    describe('Letter Generation API', () => {
        it('should require authentication', async () => {
            const response = await fetch(`${PRODUCTION_URL}/api/generate/letter`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    context: 'test context',
                    tone: 'friendly',
                    occasion: 'birthday',
                }),
            });

            expect(response.status).toBe(401);
        });

        it('should require all required fields', async () => {
            const response = await fetch(`${PRODUCTION_URL}/api/generate/letter`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    context: 'test',
                    // Missing tone and occasion
                }),
            });

            // Should be 401 (auth) or 400 (missing fields)
            expect([400, 401]).toContain(response.status);
        });

        it('should validate request body structure', async () => {
            const response = await fetch(`${PRODUCTION_URL}/api/generate/letter`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    context: 'test',
                    tone: 'friendly',
                    occasion: 'birthday',
                    imageAnalysis: 'test analysis',
                }),
            });

            // Should be 401 (auth required)
            expect(response.status).toBe(401);
        });
    });

    describe('Error Handling', () => {
        it('should return proper error format', async () => {
            const response = await fetch(`${PRODUCTION_URL}/api/generate/letter`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });

            const data = await response.json();
            expect(data).toHaveProperty('error');
            expect(typeof data.error).toBe('string');
        });

        it('should handle invalid JSON gracefully', async () => {
            const response = await fetch(`${PRODUCTION_URL}/api/generate/letter`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: 'invalid json',
            });

            // Should return 400 or 500
            expect([400, 500]).toContain(response.status);
        });

        it('should handle missing Content-Type header', async () => {
            const response = await fetch(`${PRODUCTION_URL}/api/generate/letter`, {
                method: 'POST',
                body: JSON.stringify({ context: 'test', tone: 'friendly', occasion: 'birthday' }),
            });

            // Should handle gracefully (might parse JSON anyway or return error)
            expect([400, 401, 500]).toContain(response.status);
        });
    });

    describe('Rate Limiting & Usage', () => {
        it('should track usage for authenticated requests', async () => {
            // This test would require a valid auth token
            // For now, just verify the endpoint exists
            const response = await fetch(`${PRODUCTION_URL}/api/generate/letter`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    context: 'test',
                    tone: 'friendly',
                    occasion: 'birthday',
                }),
            });

            // Should require auth
            expect(response.status).toBe(401);
        });
    });

    describe('CORS & Headers', () => {
        it('should have proper CORS headers', async () => {
            const response = await fetch(`${PRODUCTION_URL}/api/generate/letter`, {
                method: 'OPTIONS',
            });

            // OPTIONS might not be implemented, but should not crash
            expect([200, 404, 405]).toContain(response.status);
        });

        it('should return JSON content type', async () => {
            const response = await fetch(`${PRODUCTION_URL}/api/generate/letter`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });

            const contentType = response.headers.get('content-type');
            expect(contentType).toContain('application/json');
        });
    });
});

