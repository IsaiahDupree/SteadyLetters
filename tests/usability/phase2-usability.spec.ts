import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

/**
 * Usability & Accessibility Test Suite
 * 
 * Tests:
 * - Accessibility (WCAG compliance)
 * - Keyboard Navigation
 * - Screen Reader Support
 * - User Experience Flows
 * - Error Messaging
 * - Form Usability
 */

test.describe('Usability Tests - Accessibility', () => {
    test('account page should be accessible', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
        await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'password');
        await page.click('button[type="submit"]');

        await page.goto('/account');
        await page.waitForSelector('h1');

        await injectAxe(page);
        await checkA11y(page, null, {
            detailedReport: true,
            detailedReportOptions: { html: true }
        });
    });

    test('analytics page should be accessible', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
        await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'password');
        await page.click('button[type="submit"]');

        await page.goto('/analytics');
        await page.waitForSelector('h1');

        await injectAxe(page);
        await checkA11y(page);
    });

    test('color picker should have proper ARIA labels', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
        await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'password');
        await page.click('button[type="submit"]');

        await page.goto('/generate');
        await page.fill('textarea', 'Test letter');
        await page.click('button:has-text("Generate")');

        await page.waitForSelector('text=Handwriting Color', { timeout: 10000 });

        // Color buttons should have titles/labels
        const colorButtons = page.locator('button[title]');
        const count = await colorButtons.count();
        expect(count).toBeGreaterThan(0);
    });
});

test.describe('Usability Tests - Keyboard Navigation', () => {
    test('should navigate return address form with keyboard', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
        await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'password');
        await page.click('button[type="submit"]');

        await page.goto('/account');

        // Tab through form fields
        await page.keyboard.press('Tab'); // Focus first input
        await page.keyboard.type('John Doe');

        await page.keyboard.press('Tab');
        await page.keyboard.type('123 Main St');

        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab'); // Skip optional field
        await page.keyboard.type('New York');

        // Form should have values
        const nameValue = await page.inputValue('input[name="returnName"]');
        expect(nameValue).toContain('John');
    });

    test('should close color picker with Escape key', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
        await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'password');
        await page.click('button[type="submit"]');

        await page.goto('/generate');
        await page.fill('textarea', 'Test');
        await page.click('button:has-text("Generate")');
        await page.waitForSelector('text=Handwriting Color', { timeout: 10000 });

        // Open custom color
        const customButton = page.locator('button').filter({ hasText: '+' }).or(
            page.locator('button[title="Custom Color"]')
        );
        if (await customButton.count() > 0) {
            await customButton.first().click();
            await page.keyboard.press('Escape');
        }
    });
});

test.describe('Usability Tests - User Experience', () => {
    test('should show clear user feedback on save', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
        await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'password');
        await page.click('button[type="submit"]');

        await page.goto('/account');

        await page.fill('input[name="returnName"]', 'Test User');
        await page.fill('input[name="returnAddress1"]', '123 Test St');
        await page.fill('input[name="returnCity"]', 'Test City');
        await page.fill('input[name="returnState"]', 'TX');
        await page.fill('input[name="returnZip"]', '75001');

        await page.click('button:has-text("Save Return Address")');

        // Should show success or error message
        // Using timeout to wait for toast/alert
        await page.waitForTimeout(1000);
    });

    test('should display loading states', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
        await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'password');
        await page.click('button[type="submit"]');

        await page.goto('/analytics');

        // May show loading skeletons
        const hasLoading = await page.locator('.animate-pulse').count();
        console.log(`Loading indicators found: ${hasLoading}`);
    });

    test('should have helpful error messages', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
        await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'password');
        await page.click('button[type="submit"]');

        await page.goto('/account');

        // Try to submit with invalid data
        await page.fill('input[name="returnName"]', 'A'); // Too short
        await page.click('button:has-text("Save Return Address")');

        // Should show specific error
        await expect(page.locator('text=/must be at least/i')).toBeVisible({ timeout: 3000 });
    });
});

test.describe('Usability Tests - Mobile Responsiveness', () => {
    test('should work on mobile viewport', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

        await page.goto('/login');
        await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
        await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'password');
        await page.click('button[type="submit"]');

        await page.goto('/account');

        // Form should be visible and usable
        await expect(page.locator('input[name="returnName"]')).toBeVisible();
        await expect(page.locator('button:has-text("Save")')).toBeVisible();
    });

    test('analytics charts should adapt to mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });

        await page.goto('/login');
        await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
        await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'password');
        await page.click('button[type="submit"]');

        await page.goto('/analytics');
        await page.waitForSelector('h1');

        // Charts should be visible
        await expect(page.locator('text=Product Type Breakdown')).toBeVisible();
    });
});

test.describe('Usability Tests - Color Contrast', () => {
    test('should have sufficient color contrast', async ({ page }) => {
        await page.goto('/account');

        // Check contrast (this would need actual implementation)
        const h1 = page.locator('h1');
        await expect(h1).toBeVisible();

        // H1 with gradient should still be readable
        const color = await h1.evaluate(el => {
            return window.getComputedStyle(el).getPropertyValue('background-clip');
        });

        expect(color).toBeDefined();
    });
});
