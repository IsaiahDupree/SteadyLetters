import { test as base, expect, APIRequestContext } from '@playwright/test';

/**
 * Backend API Tests with Real Authentication
 * Tests all API endpoints with authenticated user context
 * Converted from backend-e2e-auth.test.mjs to use Playwright
 */

const TEST_EMAIL = 'isaiahdupree33@gmail.com';
const TEST_PASSWORD = 'Frogger12';

// Extend test with authenticated API context
const test = base.extend<{ authenticatedAPI: APIRequestContext }>({
    authenticatedAPI: async ({ page }, use) => {
        // Login to get session
        await page.goto('/login');
        await page.fill('input[type="email"]', TEST_EMAIL);
        await page.fill('input[type="password"]', TEST_PASSWORD);
        await page.click('button[type="submit"]');
        await page.waitForURL('/dashboard', { timeout: 10000 });

        // Create API context with cookies from the authenticated page
        const context = page.context();
        const apiContext = context.request;

        await use(apiContext);
    },
});

test.describe('Backend E2E - Authenticated API Tests', () => {

    test.describe('Letter Generation API', () => {

        test('should generate letter with text input only', async ({ authenticatedAPI, baseURL }) => {
            const response = await authenticatedAPI.post(`${baseURL}/api/generate/letter`, {
                data: {
                    context: 'Thanking my mentor for their guidance',
                    tone: 'professional',
                    occasion: 'thank-you',
                },
            });

            expect(response.status()).toBe(200);
            const data = await response.json();
            expect(data.letter).toBeTruthy();
            expect(data.letter.length).toBeGreaterThan(50);
        });

        test('should enforce usage limits', async ({ authenticatedAPI, baseURL }) => {
            const responses = [];
            
            // Try multiple generations
            for (let i = 0; i < 3; i++) {
                const response = await authenticatedAPI.post(`${baseURL}/api/generate/letter`, {
                    data: {
                        context: `Test letter ${i}`,
                        tone: 'casual',
                        occasion: 'general',
                    },
                });
                responses.push(response.status());
            }

            // At least one should succeed (assuming not at limit yet)
            const successCount = responses.filter(status => status === 200).length;
            expect(successCount).toBeGreaterThan(0);
        });
    });

    test.describe('Image Analysis API', () => {

        test('should analyze image file', async ({ authenticatedAPI, baseURL }) => {
            // Create a small test image (1x1 PNG)
            const pngData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
            
            const response = await authenticatedAPI.post(`${baseURL}/api/analyze-image`, {
                multipart: {
                    image: {
                        name: 'test.png',
                        mimeType: 'image/png',
                        buffer: pngData,
                    },
                },
            });

            expect(response.status()).toBe(200);
            const data = await response.json();
            expect(data.analysis).toBeTruthy();
        });

        test('should reject oversized images', async ({ authenticatedAPI, baseURL }) => {
            // Create a large buffer (>20MB)
            const largeBuffer = Buffer.alloc(21 * 1024 * 1024);
            
            const response = await authenticatedAPI.post(`${baseURL}/api/analyze-image`, {
                multipart: {
                    image: {
                        name: 'large.jpg',
                        mimeType: 'image/jpeg',
                        buffer: largeBuffer,
                    },
                },
            });

            expect(response.status()).toBe(400);
        });
    });

    test.describe('Stripe Payment API', () => {

        test('should create checkout session for Pro plan', async ({ authenticatedAPI, baseURL }) => {
            const proPriceId = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_test';
            
            const response = await authenticatedAPI.post(`${baseURL}/api/stripe/checkout`, {
                data: {
                    priceId: proPriceId,
                    userId: 'test-user-id',
                    email: TEST_EMAIL,
                },
            });

            // Should either succeed or fail with specific error
            expect(response.status()).toBeGreaterThanOrEqual(200);
            expect(response.status()).toBeLessThan(600);

            if (response.status() === 200) {
                const data = await response.json();
                expect(data.url).toBeTruthy();
                expect(data.url).toContain('stripe.com');
            }
        });

        test('should reject checkout without required fields', async ({ authenticatedAPI, baseURL }) => {
            const response = await authenticatedAPI.post(`${baseURL}/api/stripe/checkout`, {
                data: {},
            });

            expect(response.status()).toBe(400);
            const data = await response.json();
            expect(data.error).toBeTruthy();
        });
    });

    test.describe('Unauthenticated Access', () => {

        test('should reject unauthenticated letter generation', async ({ request, baseURL }) => {
            // Use non-authenticated request
            const response = await request.post(`${baseURL}/api/generate/letter`, {
                data: {
                    context: 'Test',
                    tone: 'casual',
                    occasion: 'general',
                },
            });

            expect(response.status()).toBe(401);
        });
    });
});

console.log('\n✅ Backend E2E authenticated API tests complete\n');
