import { test, expect } from '@playwright/test';

test.describe('Phase 2 Features E2E', () => {
    test.beforeEach(async ({ page }) => {
        // Login before each test
        await page.goto('/login');
        await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
        await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'password');
        await page.click('button[type="submit"]');
        await page.waitForURL('/');
    });

    test.describe('Return Address Configuration', () => {
        test('should navigate to account settings', async ({ page }) => {
            await page.click('text=Account');
            await expect(page).toHaveURL('/account');
            await expect(page.locator('h1')).toContainText('Account Settings');
        });

        test('should save return address', async ({ page }) => {
            await page.goto('/account');

            await page.fill('input[name="returnName"]', 'John Doe');
            await page.fill('input[name="returnAddress1"]', '123 Main St');
            await page.fill('input[name="returnCity"]', 'New York');
            await page.fill('input[name="returnState"]', 'NY');
            await page.fill('input[name="returnZip"]', '10001');

            await page.click('button:has-text("Save Return Address")');

            // Wait for success toast
            await expect(page.locator('text=Return address updated')).toBeVisible();
        });

        test('should validate return address fields', async ({ page }) => {
            await page.goto('/account');

            await page.fill('input[name="returnName"]', 'J'); // Too short
            await page.click('button:has-text("Save Return Address")');

            // Should show validation error
            await expect(page.locator('text=Name must be at least 2 characters')).toBeVisible();
        });
    });

    test.describe('Order History', () => {
        test('should navigate to orders page', async ({ page }) => {
            await page.click('text=Orders');
            await expect(page).toHaveURL('/orders');
            await expect(page.locator('h1')).toContainText('Order History');
        });

        test('should display order statistics', async ({ page }) => {
            await page.goto('/orders');

            // Check for stats cards
            await expect(page.locator('text=Total Orders')).toBeVisible();
            await expect(page.locator('text=Total Recipients')).toBeVisible();
            await expect(page.locator('text=Total Spent')).toBeVisible();
        });

        test('should show empty state when no orders', async ({ page }) => {
            await page.goto('/orders');

            // If no orders, should show empty message
            const emptyState = page.locator('text=No orders yet');
            const hasOrders = await emptyState.isVisible({ timeout: 2000 }).catch(() => false);

            if (hasOrders) {
                await expect(page.locator('text=Your sent mail will appear here')).toBeVisible();
            }
        });

        test('should display order list with details', async ({ page }) => {
            await page.goto('/orders');

            // Check for order elements  (if any exist)
            const orderElements = page.locator('[class*="border rounded-lg"]').filter({ hasText: 'Order #' });
            const count = await orderElements.count();

            if (count > 0) {
                // First order should have status badge
                await expect(orderElements.first().locator('[class*="Badge"]')).toBeVisible();
                // Should show cost
                await expect(orderElements.first().locator('text=/\\$\\d+\\.\\d{2}/')).toBeVisible();
            }
        });
    });

    test.describe('Analytics Dashboard', () => {
        test('should navigate to analytics page', async ({ page }) => {
            await page.click('text=Analytics');
            await expect(page).toHaveURL('/analytics');
            await expect(page.locator('h1')).toContainText('Analytics');
        });

        test('should display key metrics', async ({ page }) => {
            await page.goto('/analytics');

            // Check for metric cards
            await expect(page.locator('text=This Month')).toBeVisible();
            await expect(page.locator('text=Avg Cost')).toBeVisible();
            await expect(page.locator('text=Most Used')).toBeVisible();
            await expect(page.locator('text=Total Spent')).toBeVisible();
        });

        test('should show product type breakdown chart', async ({ page }) => {
            await page.goto('/analytics');

            await expect(page.locator('text=Product Type Breakdown')).toBeVisible();
        });

        test('should show spending trend chart', async ({ page }) => {
            await page.goto('/analytics');

            await expect(page.locator('text=Spending Trend')).toBeVisible();
            await expect(page.locator('text=Last 6 months')).toBeVisible();
        });

        test('should handle loading state', async ({ page }) => {
            await page.goto('/analytics');

            // Should show loading or data
            const hasData = await page.locator('text=This Month').isVisible({ timeout: 5000 });
            expect(hasData).toBeTruthy();
        });
    });

    test.describe('Color Picker Integration', () => {
        test('should show color picker in letter generator', async ({ page }) => {
            await page.goto('/generate');

            // Generate a letter first
            await page.fill('textarea', 'Test context for letter generation');
            await page.click('button:has-text("Generate")');

            // Wait for letter to generate
            await page.waitForSelector('text=Handwriting Color', { timeout: 10000 });

            // Color picker should be visible
            await expect(page.locator('text=Handwriting Color')).toBeVisible();
        });

        test('should select preset color', async ({ page }) => {
            await page.goto('/generate');

            await page.fill('textarea', 'Test letter');
            await page.click('button:has-text("Generate")');
            await page.waitForSelector('text=Handwriting Color', { timeout: 10000 });

            // Click a color button
            const colorButtons = page.locator('button[title]').filter({ has: page.locator('div[style*="background-color"]') });
            await colorButtons.first().click();

            // Should show selected state
            const checkmark = page.locator('svg path[d*="M5 13l4 4L19 7"]');
            await expect(checkmark).toBeVisible();
        });
    });

    test.describe('Navigation', () => {
        test('should have all Phase 2 nav links', async ({ page }) => {
            await page.goto('/');

            await expect(page.locator('text=Orders')).toBeVisible();
            await expect(page.locator('text=Analytics')).toBeVisible();
            await expect(page.locator('text=Account')).toBeVisible();
        });

        test('should navigate between Phase 2 pages', async ({ page }) => {
            await page.click('text=Account');
            await expect(page).toHaveURL('/account');

            await page.click('text=Orders');
            await expect(page).toHaveURL('/orders');

            await page.click('text=Analytics');
            await expect(page).toHaveURL('/analytics');
        });
    });
});
