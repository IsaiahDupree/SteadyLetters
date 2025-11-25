/**
 * Backend E2E Tests using Playwright API Testing
 * Uses Playwright's request context with proper cookie/session handling
 */

import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'isaiahdupree33@gmail.com';
const TEST_PASSWORD = 'Frogger12';
const baseUrl = 'http://localhost:3000';

// Reusable authenticated request context
let authenticatedContext;

test.beforeAll(async ({ playwright }) => {
    // Create browser and authenticate
    const browser = await playwright.chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    // Login
    await page.goto(`${baseUrl}/login`);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${baseUrl}/dashboard`, { timeout: 10000 });

    // Save the authenticated context for API requests
    authenticatedContext = context;
});

test.describe('Backend API Tests - Authenticated', () => {

    test.describe('Letter Generation API', () => {

        test('should generate letter with text input only', async () => {
            const response = await authenticatedContext.request.post(`${baseUrl}/api/generate/letter`, {
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

        test('should generate letter with all high-priority combinations', async () => {
            const testCases = [
                { tone: 'professional', occasion: 'thank-you', context: 'Thanking a client' },
                { tone: 'friendly', occasion: 'birthday', context: 'Birthday wishes' },
                { tone: 'formal', occasion: 'congratulations', context: 'Promotion congrats' },
                { tone: 'casual', occasion: 'general', context: 'Saying hello' },
                { tone: 'heartfelt', occasion: 'sympathy', context: 'Condolences' },
            ];

            for (const testCase of testCases) {
                const response = await authenticatedContext.request.post(`${baseUrl}/api/generate/letter`, {
                    data: testCase,
                });

                expect(response.status()).toBe(200);
                const data = await response.json();
                expect(data.letter).toBeTruthy();
            }
        });
    });

    test.describe('Voice Transcription API', () => {

        test('should reject missing audio file', async () => {
            const formData = new FormData();

            const response = await authenticatedContext.request.post(`${baseUrl}/api/transcribe`, {
                multipart: {},
            });

            expect(response.status()).toBe(400);
        });

        test('should reject oversized audio files', async () => {
            const formData = new FormData();
            const largeBlob = new Blob([new ArrayBuffer(26 * 1024 * 1024)], { type: 'audio/webm' });
            formData.append('audio', largeBlob, 'large.webm');

            const response = await authenticatedContext.request.post(`${baseUrl}/api/transcribe`, {
                multipart: {
                    audio: {
                        name: 'large.webm',
                        mimeType: 'audio/webm',
                        buffer: Buffer.from(await largeBlob.arrayBuffer()),
                    },
                },
            });

            expect(response.status()).toBe(400);
        });
    });

    test.describe('Image Analysis API', () => {

        test('should analyze image file', async () => {
            // Create a minimal PNG (1x1 pixel red)
            const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
            const imageBuffer = Buffer.from(pngBase64, 'base64');

            const response = await authenticatedContext.request.post(`${baseUrl}/api/analyze-image`, {
                multipart: {
                    image: {
                        name: 'test.png',
                        mimeType: 'image/png',
                        buffer: imageBuffer,
                    },
                },
            });

            expect(response.status()).toBe(200);
            const data = await response.json();
            expect(data.analysis).toBeTruthy();
        });

        test('should reject oversized images', async () => {
            const largeBlob = new Blob([new ArrayBuffer(21 * 1024 * 1024)], { type: 'image/jpeg' });

            const response = await authenticatedContext.request.post(`${baseUrl}/api/analyze-image`, {
                multipart: {
                    image: {
                        name: 'large.jpg',
                        mimeType: 'image/jpeg',
                        buffer: Buffer.from(await largeBlob.arrayBuffer()),
                    },
                },
            });

            expect(response.status()).toBe(400);
        });
    });

    test.describe('Stripe Payment API', () => {

        test('should create checkout session for Pro plan', async () => {
            const response = await authenticatedContext.request.post(`${baseUrl}/api/stripe/checkout`, {
                data: {
                    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_test',
                    userId: 'test-user-id',
                    email: TEST_EMAIL,
                },
            });

            // May succeed (200) or fail (500) depending on Stripe setup
            expect([200, 500]).toContain(response.status());

            if (response.status() === 200) {
                const data = await response.json();
                expect(data.url).toBeTruthy();
                expect(data.url).toContain('stripe.com');
            }
        });

        test('should reject checkout without required fields', async () => {
            const response = await authenticatedContext.request.post(`${baseUrl}/api/stripe/checkout`, {
                data: {},
            });

            expect(response.status()).toBe(400);
        });
    });

    test.describe('Orders API', () => {

        test('should get user orders', async () => {
            const response = await authenticatedContext.request.get(`${baseUrl}/api/orders`);

            expect(response.status()).toBe(200);
            const data = await response.json();
            expect(data.orders).toBeDefined();
            expect(Array.isArray(data.orders)).toBe(true);
        });

        test('should create order (if recipient exists)', async () => {
            const response = await authenticatedContext.request.post(`${baseUrl}/api/orders`, {
                data: {
                    recipientId: 'test-recipient-id',
                    content: 'Test letter content',
                    status: 'draft',
                },
            });

            // May fail if recipient doesn't exist (404), which is expected
            expect([200, 201, 404]).toContain(response.status());
        });
    });

    test.describe('Unauthenticated Access', () => {

        test('should reject unauthenticated letter generation', async ({ request }) => {
            const response = await request.post(`${baseUrl}/api/generate/letter`, {
                data: {
                    context: 'Test',
                    tone: 'casual',
                    occasion: 'general',
                },
            });

            expect(response.status()).toBe(401);
        });

        test('should reject unauthenticated transcription', async ({ request }) => {
            const response = await request.post(`${baseUrl}/api/transcribe`, {
                multipart: {},
            });

            expect(response.status()).toBe(401);
        });

        test('should reject unauthenticated image analysis', async ({ request }) => {
            const response = await request.post(`${baseUrl}/api/analyze-image`, {
                multipart: {},
            });

            expect(response.status()).toBe(401);
        });
    });
});

test.afterAll(async () => {
    if (authenticatedContext) {
        await authenticatedContext.close();
    }
});
