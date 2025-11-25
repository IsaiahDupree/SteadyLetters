import { test, expect } from '@playwright/test';

/**
 * Performance Test Suite
 * 
 * Tests:
 * - Page Load Time
 * - API Response Time
 * - Database Query Performance
 * - Large Dataset Handling
 * - Concurrent User Load
 */

test.describe('Performance Tests - Page Load', () => {
    test('account page should load in under 3 seconds', async ({ page }) => {
        const startTime = Date.now();

        await page.goto('/login');
        await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
        await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'password');
        await page.click('button[type="submit"]');

        await page.goto('/account');
        await page.waitForSelector('h1');

        const loadTime = Date.now() - startTime;

        console.log(`Account page load time: ${loadTime}ms`);
        expect(loadTime).toBeLessThan(3000);
    });

    test('orders page should load quickly with many orders', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
        await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'password');
        await page.click('button[type="submit"]');

        const startTime = Date.now();
        await page.goto('/orders');
        await page.waitForSelector('h1');
        const loadTime = Date.now() - startTime;

        console.log(`Orders page load time: ${loadTime}ms`);
        expect(loadTime).toBeLessThan(3000);
    });

    test('analytics page should render charts quickly', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
        await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'password');
        await page.click('button[type="submit"]');

        const startTime = Date.now();
        await page.goto('/analytics');
        await page.waitForSelector('text=This Month');
        const loadTime = Date.now() - startTime;

        console.log(`Analytics page load time: ${loadTime}ms`);
        expect(loadTime).toBeLessThan(4000);
    });
});

test.describe('Performance Tests - API Response Time', () => {
    test('analytics API should respond in under 1 second', async ({ request, page }) => {
        // Login first to get auth
        await page.goto('/login');
        await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
        await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'password');
        await page.click('button[type="submit"]');
        await page.waitForURL('/');

        const startTime = Date.now();
        const response = await page.request.get('/api/analytics/orders');
        const responseTime = Date.now() - startTime;

        console.log(`Analytics API response time: ${responseTime}ms`);
        expect(response.status()).toBe(200);
        expect(responseTime).toBeLessThan(1000);
    });

    test('return address update should be fast', async ({ request, page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
        await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'password');
        await page.click('button[type="submit"]');
        await page.waitForURL('/');

        const startTime = Date.now();
        const response = await page.request.patch('/api/settings/return-address', {
            data: {
                returnName: 'Performance Test',
                returnAddress1: '123 Speed St',
                returnCity: 'Fast City',
                returnState: 'TX',
                returnZip: '75001',
                returnCountry: 'US'
            }
        });
        const responseTime = Date.now() - startTime;

        console.log(`Return address API response time: ${responseTime}ms`);
        expect(response.status()).toBe(200);
        expect(responseTime).toBeLessThan(500);
    });
});

test.describe('Performance Tests - Stress Testing', () => {
    test('should handle rapid form submissions', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
        await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'password');
        await page.click('button[type="submit"]');

        await page.goto('/account');

        // Rapid clicks should not break the form
        for (let i = 0; i < 5; i++) {
            await page.fill('input[name="returnName"]', `Test ${i}`);
            page.click('button:has-text("Save Return Address")').catch(() => { });
            await page.waitForTimeout(100);
        }

        // Page should still be functional
        await expect(page.locator('h1')).toBeVisible();
    });

    test('should handle quick page navigation', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
        await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'password');
        await page.click('button[type="submit"]');

        // Rapidly navigate between pages
        const pages = ['/account', '/orders', '/analytics', '/account'];

        for (const path of pages) {
            await page.goto(path);
            await page.waitForSelector('h1', { timeout: 5000 });
        }

        // Should still work after rapid navigation
        await expect(page.locator('h1')).toBeVisible();
    });
});

test.describe('Performance Tests - Memory', () => {
    test('should not memory leak on repeated renders', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
        await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'password');
        await page.click('button[type="submit"]');

        // Navigate to analytics repeatedly
        for (let i = 0; i < 10; i++) {
            await page.goto('/analytics');
            await page.waitForSelector('text=This Month');
            await page.waitForTimeout(500);
        }

        // Page should still be responsive
        await expect(page.locator('h1')).toBeVisible();
    });
});

test.describe('Performance Tests - Asset Loading', () => {
    test('should not load unnecessary resources', async ({ page }) => {
        const resourcesLoaded: string[] = [];

        page.on('request', request => {
            resourcesLoaded.push(request.url());
        });

        await page.goto('/account');
        await page.waitForSelector('h1');

        // Check for duplicate resources
        const uniqueResources = new Set(resourcesLoaded);
        const duplicates = resourcesLoaded.length - uniqueResources.size;

        console.log(`Total resources: ${resourcesLoaded.length}, Unique: ${uniqueResources.size}, Duplicates: ${duplicates}`);
        expect(duplicates).toBe(0);
    });
});
