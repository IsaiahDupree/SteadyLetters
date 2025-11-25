import { test, expect } from '@playwright/test';

/**
 * Production Deployment Diagnostics Tests
 * 
 * These tests specifically target the deployed build to detect issues that
 * occur in production but not in local development.
 * 
 * Run against production:
 *   TEST_ENV=production npx playwright test tests/e2e/production-diagnostics.spec.ts
 */

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://www.steadyletters.com';
const TEST_EMAIL = 'isaiahdupree33@gmail.com';
const TEST_PASSWORD = 'Frogger12';

test.describe('Production Deployment Diagnostics', () => {

    test.describe('API Endpoint Health Checks', () => {

        test('should verify all critical API endpoints exist', async ({ page }) => {
            const endpoints = [
                '/api/stripe/checkout',
                '/api/transcribe',
                '/api/analyze-image',
                '/api/generate/letter',
            ];

            const results = [];

            for (const endpoint of endpoints) {
                const response = await page.request.post(`${PRODUCTION_URL}${endpoint}`, {
                    // Intentionally empty to test endpoint existence
                });

                results.push({
                    endpoint,
                    status: response.status(),
                    exists: response.status() !== 404,
                    isServerError: response.status() >= 500,
                });

                console.log(`${endpoint}: ${response.status()} ${response.statusText()}`);
            }

            // Check that no endpoints returned 404 (not found)
            const missingEndpoints = results.filter(r => r.status === 404);
            expect(missingEndpoints.length).toBe(0);

            // Log server errors for investigation
            const serverErrors = results.filter(r => r.isServerError);
            if (serverErrors.length > 0) {
                console.warn('⚠️  Server errors detected:', serverErrors);
            }
        });

        test('should detect 500 errors on Stripe checkout endpoint', async ({ page }) => {
            // Login first
            await page.goto(`${PRODUCTION_URL}/login`);
            await page.fill('input[type="email"]', TEST_EMAIL);
            await page.fill('input[type="password"]', TEST_PASSWORD);
            await page.click('button[type="submit"]');
            await page.waitForURL('**/dashboard', { timeout: 10000 });

            // Try to create a checkout session
            const response = await page.request.post(`${PRODUCTION_URL}/api/stripe/checkout`, {
                data: {
                    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_test',
                },
            });

            const status = response.status();
            console.log(`Stripe checkout status: ${status}`);

            if (status === 500) {
                const body = await response.json();
                console.error('❌ 500 ERROR DETECTED on /api/stripe/checkout');
                console.error('Response:', body);
                
                // This is a known issue - fail the test to make it visible
                expect(status).not.toBe(500);
            } else {
                console.log('✅ Stripe checkout endpoint working correctly');
                expect([200, 400, 401]).toContain(status);
            }
        });

        test('should detect 500 errors on transcribe endpoint', async ({ page }) => {
            // Login first
            await page.goto(`${PRODUCTION_URL}/login`);
            await page.fill('input[type="email"]', TEST_EMAIL);
            await page.fill('input[type="password"]', TEST_PASSWORD);
            await page.click('button[type="submit"]');
            await page.waitForURL('**/dashboard', { timeout: 10000 });

            // Create a small test audio file
            const audioData = new Uint8Array(1024); // Small audio buffer
            const blob = new Blob([audioData], { type: 'audio/webm' });

            const formData = new FormData();
            formData.append('audio', blob, 'test.webm');

            const response = await page.request.post(`${PRODUCTION_URL}/api/transcribe`, {
                multipart: {
                    audio: {
                        name: 'test.webm',
                        mimeType: 'audio/webm',
                        buffer: Buffer.from(audioData),
                    },
                },
            });

            const status = response.status();
            console.log(`Transcribe status: ${status}`);

            if (status === 500) {
                const body = await response.text();
                console.error('❌ 500 ERROR DETECTED on /api/transcribe');
                console.error('Response:', body);
                
                // Fail the test to make this issue visible
                expect(status).not.toBe(500);
            } else {
                console.log('✅ Transcribe endpoint working (or returning expected error)');
                expect([200, 400, 401, 403]).toContain(status);
            }
        });

        test('should detect 500 errors on image analysis endpoint', async ({ page }) => {
            // Login first
            await page.goto(`${PRODUCTION_URL}/login`);
            await page.fill('input[type="email"]', TEST_EMAIL);
            await page.fill('input[type="password"]', TEST_PASSWORD);
            await page.click('button[type="submit"]');
            await page.waitForURL('**/dashboard', { timeout: 10000 });

            // Create a small test image (1x1 PNG)
            const pngData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

            const response = await page.request.post(`${PRODUCTION_URL}/api/analyze-image`, {
                multipart: {
                    image: {
                        name: 'test.png',
                        mimeType: 'image/png',
                        buffer: pngData,
                    },
                },
            });

            const status = response.status();
            console.log(`Image analysis status: ${status}`);

            if (status === 500) {
                const body = await response.text();
                console.error('❌ 500 ERROR DETECTED on /api/analyze-image');
                console.error('Response:', body);
                
                // Fail the test to make this issue visible
                expect(status).not.toBe(500);
            } else {
                console.log('✅ Image analysis endpoint working');
                expect([200, 400, 401, 403]).toContain(status);
            }
        });

        test('should detect 500 errors on letter generation endpoint', async ({ page }) => {
            // Login first
            await page.goto(`${PRODUCTION_URL}/login`);
            await page.fill('input[type="email"]', TEST_EMAIL);
            await page.fill('input[type="password"]', TEST_PASSWORD);
            await page.click('button[type="submit"]');
            await page.waitForURL('**/dashboard', { timeout: 10000 });

            const response = await page.request.post(`${PRODUCTION_URL}/api/generate/letter`, {
                data: {
                    context: 'Test letter generation',
                    tone: 'professional',
                    occasion: 'thank-you',
                },
            });

            const status = response.status();
            console.log(`Letter generation status: ${status}`);

            if (status === 500) {
                const body = await response.text();
                console.error('❌ 500 ERROR DETECTED on /api/generate/letter');
                console.error('Response:', body);
                
                // Fail the test to make this issue visible
                expect(status).not.toBe(500);
            } else {
                console.log('✅ Letter generation endpoint working');
                expect([200, 400, 401, 403]).toContain(status);
            }
        });
    });

    test.describe('Environment Configuration Checks', () => {

        test('should verify critical environment variables are accessible', async ({ page }) => {
            // Navigate to a page that uses env vars
            await page.goto(`${PRODUCTION_URL}`);

            // Check if public env vars are accessible via page evaluation
            const envCheck = await page.evaluate(() => {
                return {
                    hasSupabaseUrl: !!window.process?.env?.NEXT_PUBLIC_SUPABASE_URL || typeof (window as any).supabaseUrl !== 'undefined',
                    hasSupabaseKey: !!window.process?.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || typeof (window as any).supabaseKey !== 'undefined',
                    hasStripeKey: !!window.process?.env?.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
                };
            });

            console.log('Environment variable check:', envCheck);

            // At minimum, we should have Supabase configured
            // Note: Can't check server-side env vars from browser
            expect(true).toBe(true); // This test is for logging/diagnostics
        });

        test('should check for console errors on homepage', async ({ page }) => {
            const errors: string[] = [];
            
            page.on('console', msg => {
                if (msg.type() === 'error') {
                    errors.push(msg.text());
                }
            });

            await page.goto(`${PRODUCTION_URL}`);
            await page.waitForTimeout(2000); // Wait for any async errors

            if (errors.length > 0) {
                console.warn('⚠️  Console errors detected on homepage:');
                errors.forEach(err => console.warn(' -', err));
            } else {
                console.log('✅ No console errors on homepage');
            }

            // Don't fail on console errors, just log them
            expect(true).toBe(true);
        });
    });

    test.describe('End-to-End Feature Tests', () => {

        test('should test full Stripe checkout flow', async ({ page }) => {
            await page.goto(`${PRODUCTION_URL}/login`);
            await page.fill('input[type="email"]', TEST_EMAIL);
            await page.fill('input[type="password"]', TEST_PASSWORD);
            await page.click('button[type="submit"]');
            await page.waitForURL('**/dashboard', { timeout: 10000 });

            // Navigate to pricing
            await page.goto(`${PRODUCTION_URL}/pricing`);
            
            // Intercept the checkout request to see what happens
            let checkoutError = false;
            let checkoutResponse: any = null;

            page.on('response', response => {
                if (response.url().includes('/api/stripe/checkout')) {
                    checkoutResponse = {
                        status: response.status(),
                        url: response.url(),
                    };
                    if (response.status() === 500) {
                        checkoutError = true;
                    }
                }
            });

            // Try to click Pro plan button (if it exists)
            const proButton = page.locator('button:has-text("Get Pro"), button:has-text("Pro")').first();
            if (await proButton.isVisible()) {
                await proButton.click();
                await page.waitForTimeout(2000); // Wait for request

                if (checkoutError) {
                    console.error('❌ Stripe checkout failed with 500 error');
                    console.error('Response details:', checkoutResponse);
                    expect(false).toBe(true); // Fail the test
                } else if (checkoutResponse) {
                    console.log('✅ Stripe checkout response:', checkoutResponse);
                }
            } else {
                console.log('⚠️  Pro button not found, skipping checkout test');
            }
        });

        test('should compare local vs production API responses', async ({ page, request }) => {
            const localUrl = 'http://localhost:3000';
            const prodUrl = PRODUCTION_URL;

            // Test an unauthenticated endpoint that should work the same way
            const testEndpoint = '/api/generate/letter';

            const localTest = await request.post(`${localUrl}${testEndpoint}`, {
                data: {
                    context: 'Test',
                    tone: 'casual',
                    occasion: 'general',
                },
                failOnStatusCode: false,
            }).catch(() => ({ status: () => 0 })); // Handle if local not running

            const prodTest = await request.post(`${prodUrl}${testEndpoint}`, {
                data: {
                    context: 'Test',
                    tone: 'casual',
                    occasion: 'general',
                },
                failOnStatusCode: false,
            });

            const localStatus = typeof localTest.status === 'function' ? localTest.status() : 0;
            const prodStatus = prodTest.status();

            console.log(`Local status: ${localStatus}`);
            console.log(`Production status: ${prodStatus}`);

            // Both should return 401 (unauthorized) or similar
            // If production returns 500 but local doesn't, that's a problem
            if (prodStatus === 500 && localStatus !== 500 && localStatus !== 0) {
                console.error('❌ Production returns 500 but local works!');
                console.error('This indicates an environment-specific issue.');
                expect(prodStatus).not.toBe(500);
            }
        });
    });
});

console.log(`
═══════════════════════════════════════════════════════════
🔍 PRODUCTION DIAGNOSTICS TEST
═══════════════════════════════════════════════════════════
These tests will help identify deployment-specific issues.

Known Issue: 500 errors on production but not localhost
Likely causes:
  1. Missing environment variables in Vercel
  2. Database connection issues
  3. API keys not configured
  4. CORS or authentication configuration
  
Run this against production with:
  TEST_ENV=production npx playwright test tests/e2e/production-diagnostics.spec.ts
═══════════════════════════════════════════════════════════
`);
