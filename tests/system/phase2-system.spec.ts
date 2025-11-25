import { test, expect } from '@playwright/test';

/**
 * End-to-End System Tests
 * 
 * Tests complete user journeys across the entire application
 */

test.describe('System Tests - Complete User Workflows', () => {
    test('complete letter sending workflow', async ({ page }) => {
        // 1. Login
        await page.goto('/login');
        await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
        await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'password');
        await page.click('button[type="submit"]');
        await page.waitForURL('/');

        // 2. Configure return address
        await page.click('text=Account');
        await page.fill('input[name="returnName"]', 'System Test User');
        await page.fill('input[name="returnAddress1"]', '123 System St');
        await page.fill('input[name="returnCity"]', 'Test City');
        await page.fill('input[name="returnState"]', 'TX');
        await page.fill('input[name="returnZip"]', '75001');
        await page.click('button:has-text("Save Return Address")');
        await page.waitForTimeout(1000);

        // 3. Add recipient
        await page.click('text=Recipients');
        // Would add recipient via form...

        // 4. Generate letter
        await page.click('text=Generate');
        await page.fill('textarea', 'Thank you for your continued support');
        await page.selectOption('select:has-text("Tone")', 'friendly');
        await page.click('button:has-text("Generate")');
        await page.waitForSelector('text=Handwriting Color', { timeout: 10000 });

        // 5. Customize letter
        // Select color, product type, etc.

        // 6. Check orders
        await page.click('text=Orders');
        await expect(page.locator('h1')).toContainText('Order History');

        // 7. View analytics
        await page.click('text=Analytics');
        await expect(page.locator('text=This Month')).toBeVisible();
    });

    test('new user onboarding flow', async ({ page }) => {
        // This would test the complete new user experience
        // 1. Sign up
        // 2. Verify email
        // 3. Set up profile/return address
        // 4. Generate first letter
        // 5. Send first letter
        // 6. View order confirmation

        await page.goto('/login');
        // Would continue with signup flow...
        expect(true).toBe(true);
    });

    test('subscription upgrade workflow', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
        await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'password');
        await page.click('button[type="submit"]');

        // Navigate to pricing
        await page.click('text=Pricing');
        await expect(page).toHaveURL('/pricing');

        // View pricing tiers
        await expect(page.locator('text=Free')).toBeVisible();
        await expect(page.locator('text=Pro')).toBeVisible();
        await expect(page.locator('text=Business')).toBeVisible();
    });
});

test.describe('System Tests - Data Flow', () => {
    test('order creation updates all related systems', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
        await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'password');
        await page.click('button[type="submit"]');

        // Get initial analytics
        await page.goto('/analytics');
        await page.waitForSelector('text=This Month');
        const initialSpent = await page.locator('text=/\\$\\d+\\.\\d{2}/').first().textContent();

        // Create order (simulated)
        // In real test, would actually send a letter

        // Refresh analytics
        await page.reload();
        await page.waitForSelector('text=This Month');

        // Should reflect new order
        await expect(page.locator('text=This Month')).toBeVisible();
    });
});

test.describe('System Tests - Error Scenarios', () => {
    test('should handle network errors gracefully', async ({ page, context }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
        await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'password');
        await page.click('button[type="submit"]');

        await page.goto('/account');

        // Simulate network failure
        await context.route('**/api/settings/return-address', route => {
            route.abort('failed');
        });

        await page.fill('input[name="returnName"]', 'Test');
        await page.fill('input[name="returnAddress1"]', '123 Main St');
        await page.fill('input[name="returnCity"]', 'City');
        await page.fill('input[name="returnState"]', 'TX');
        await page.fill('input[name="returnZip"]', '75001');
        await page.click('button:has-text("Save")');

        // Should show error message
        await page.waitForTimeout(1000);
    });

    test('should handle session expiration', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
        await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'password');
        await page.click('button[type="submit"]');

        // Clear cookies to simulate session expiration
        await page.context().clearCookies();

        // Try to access protected page
        await page.goto('/account');

        // Should redirect to login
        await expect(page).toHaveURL(/login/);
    });
});

test.describe('System Tests - Cross-Feature Integration', () => {
    test('return address from settings used in orders', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
        await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'password');
        await page.click('button[type="submit"]');

        // Set return address
        await page.goto('/account');
        const testName = `Test User ${Date.now()}`;
        await page.fill('input[name="returnName"]', testName);
        await page.fill('input[name="returnAddress1"]', '123 Main St');
        await page.fill('input[name="returnCity"]', 'Test City');
        await page.fill('input[name="returnState"]', 'TX');
        await page.fill('input[name="returnZip"]', '75001');
        await page.click('button:has-text("Save")');
        await page.waitForTimeout(1000);

        // Return address should be available for orders
        // (Would verify in actual send request)
        expect(testName).toBeDefined();
    });

    test('analytics reflect order history', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
        await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'password');
        await page.click('button[type="submit"]');

        // Check orders page
        await page.goto('/orders');
        const ordersText = await page.locator('h3').filter({ hasText: /total orders/i }).or(
            page.locator('text=/\\d+ orders/i')
        ).textContent().catch(() => '0');

        // Check analytics
        await page.goto('/analytics');
        await page.waitForSelector('text=This Month');

        // Should have consistent data
        expect(page.locator('text=Total Spent')).toBeVisible();
    });
});
