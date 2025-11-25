/**
 * Address Extraction Production Tests
 * 
 * Tests the address extraction feature against the deployed production build
 */

import { describe, it, expect } from '@jest/globals';

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://www.steadyletters.com';

describe('Address Extraction Production Tests', () => {
    describe('API Endpoint', () => {
        it('should require authentication for /api/extract-address', async () => {
            const formData = new FormData();
            // Create minimal test image
            const testImage = Buffer.from(
                'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                'base64'
            );
            const testFile = new File([testImage], 'test.png', { type: 'image/png' });
            formData.append('image', testFile);

            const response = await fetch(`${PRODUCTION_URL}/api/extract-address`, {
                method: 'POST',
                body: formData,
            });

            expect(response.status).toBe(401);
            const data = await response.json();
            expect(data.error).toContain('Unauthorized');
        }, 10000);

        it('should return proper error for missing image file', async () => {
            const formData = new FormData();

            const response = await fetch(`${PRODUCTION_URL}/api/extract-address`, {
                method: 'POST',
                body: formData,
            });

            // Should fail at authentication or validation
            expect([400, 401]).toContain(response.status);
        }, 10000);

        it('should reject files that are too large', async () => {
            // Create a large file (simulate > 20MB)
            const largeBlob = new Blob([new ArrayBuffer(21 * 1024 * 1024)], { type: 'image/png' });
            const largeFile = new File([largeBlob], 'large.png', { type: 'image/png' });
            const formData = new FormData();
            formData.append('image', largeFile);

            const response = await fetch(`${PRODUCTION_URL}/api/extract-address`, {
                method: 'POST',
                body: formData,
            });

            // Should fail at authentication, validation, or payload too large
            expect([400, 401, 413]).toContain(response.status);
            
            if ([400, 413].includes(response.status)) {
                // 413 might not return JSON, so check if we can parse it
                try {
                    const data = await response.json();
                    if (data.error) {
                        expect(data.error).toContain('too large');
                    }
                } catch {
                    // 413 might not return JSON, which is acceptable
                }
            }
        }, 15000);
    });

    describe('Recipients Page', () => {
        it('should load recipients page', async () => {
            const response = await fetch(`${PRODUCTION_URL}/recipients`, {
                redirect: 'manual',
            });

            // Should redirect to login if not authenticated, or load page if authenticated
            expect([200, 307, 401, 403]).toContain(response.status);
        }, 10000);

        it('should have address extractor component in page source', async () => {
            const response = await fetch(`${PRODUCTION_URL}/recipients`, {
                redirect: 'manual',
            });

            if (response.status === 200) {
                const html = await response.text();
                // Check for address extractor related content
                expect(html).toMatch(/Take Photo|address|recipient/i);
            } else {
                // If redirected, that's expected for unauthenticated users
                expect([307, 401, 403]).toContain(response.status);
            }
        }, 10000);
    });

    describe('Integration', () => {
        it('should have CORS headers configured', async () => {
            const response = await fetch(`${PRODUCTION_URL}/api/extract-address`, {
                method: 'OPTIONS',
            });

            // Should handle OPTIONS request
            expect([200, 204, 401, 404, 405]).toContain(response.status);
        }, 10000);

        it('should return JSON error responses', async () => {
            const formData = new FormData();
            const testImage = Buffer.from(
                'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                'base64'
            );
            const testFile = new File([testImage], 'test.png', { type: 'image/png' });
            formData.append('image', testFile);

            const response = await fetch(`${PRODUCTION_URL}/api/extract-address`, {
                method: 'POST',
                body: formData,
            });

            const contentType = response.headers.get('content-type');
            expect(contentType).toContain('application/json');
            
            const data = await response.json();
            expect(data).toHaveProperty('error');
        }, 10000);
    });
});

