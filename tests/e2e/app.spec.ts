import { test, expect } from '@playwright/test';

test.describe('SteadyLetters E2E Tests', () => {
    test.describe('Public Pages', () => {
        test('landing page loads and displays hero', async ({ page }) => {
            await page.goto('/');

            // Check for hero section
            await expect(page.getByRole('heading', { name: /turn your thoughts into heartfelt/i })).toBeVisible();

            // Check for CTA buttons
            await expect(page.getByRole('link', { name: /start free trial/i })).toBeVisible();
            await expect(page.getByRole('link', { name: /view pricing/i })).toBeVisible();
        });

        test('pricing page displays all tiers', async ({ page }) => {
            await page.goto('/pricing');

            // Check for tier names as text (they are h3 elements within cards)
            await expect(page.getByText('Free', { exact: true }).first()).toBeVisible();
            await expect(page.getByText('Pro', { exact: true }).first()).toBeVisible();
            await expect(page.getByText('Business', { exact: true }).first()).toBeVisible();

            // Check for FAQ section
            await expect(page.getByRole('heading', { name: /frequently asked questions/i })).toBeVisible();
        });
        test('privacy policy page loads', async ({ page }) => {
            await page.goto('/privacy');

            await expect(page.getByRole('heading', { name: /privacy policy/i })).toBeVisible();
            await expect(page.getByText(/information we collect/i)).toBeVisible();
        });

        test('terms of service page loads', async ({ page }) => {
            await page.goto('/terms');

            await expect(page.getByRole('heading', { name: /terms of service/i })).toBeVisible();
            await expect(page.getByText(/acceptance of terms/i)).toBeVisible();
        });
    });

    test.describe('Authentication Flow', () => {
        test('signup page displays form', async ({ page }) => {
            await page.goto('/signup');

            // Check for signup form elements
            await expect(page.getByLabel(/email/i)).toBeVisible();
            await expect(page.getByLabel(/password/i)).toBeVisible();
            await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible();

            // Check for login link
            await expect(page.getByRole('link', { name: /log in/i })).toBeVisible();
        });

        test('login page displays form', async ({ page }) => {
            await page.goto('/login');

            // Check form elements
            await expect(page.getByLabel(/email/i)).toBeVisible();
            await expect(page.getByLabel(/password/i)).toBeVisible();
            await expect(page.getByRole('button', { name: /log in/i })).toBeVisible();

            // Check signup link (use first match to avoid strict mode)
            await expect(page.getByRole('link', { name: /sign up/i }).first()).toBeVisible();

            // Verify page title
            await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
        });
        test('validates email format on signup', async ({ page }) => {
            await page.goto('/signup');

            // Type invalid email
            await page.getByLabel(/email/i).fill('not-an-email');
            await page.getByLabel(/password/i).fill('password123');
            await page.getByRole('button', { name: /sign up/i }).click();

            // Browser should show validation error (HTML5 validation)
            const emailInput = page.getByLabel(/email/i);
            const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
            expect(validationMessage).toBeTruthy();
        });

        test('validates password length on signup', async ({ page }) => {
            await page.goto('/signup');

            // Type short password
            await page.getByLabel(/email/i).fill('test@example.com');
            await page.getByLabel(/password/i).fill('12345');
            await page.getByRole('button', { name: /sign up/i }).click();

            // Should show validation error
            const passwordInput = page.getByLabel(/password/i);
            const validationMessage = await passwordInput.evaluate((el: HTMLInputElement) => el.validationMessage);
            expect(validationMessage).toBeTruthy();
        });
    });

    test.describe('Protected Routes', () => {
        test('dashboard redirects to login when not authenticated', async ({ page }) => {
            await page.goto('/dashboard');

            // Should redirect to login page
            await expect(page).toHaveURL(/\/login/);
        });

        test('generate page redirects to login when not authenticated', async ({ page }) => {
            await page.goto('/generate');

            // Should redirect to login page
            await expect(page).toHaveURL(/\/login/);
        });

        test('billing page redirects to login when not authenticated', async ({ page }) => {
            await page.goto('/billing');

            // Should redirect to login page
            await expect(page).toHaveURL(/\/login/);
        });

        test('orders page redirects to login when not authenticated', async ({ page }) => {
            await page.goto('/orders');

            // Should redirect to login page
            await expect(page).toHaveURL(/\/login/);
        });
    });

    test.describe('Navigation', () => {
        test('navbar displays correctly on landing page', async ({ page }) => {
            await page.goto('/');

            // Check for logo/brand
            await expect(page.getByText('SteadyLetters')).toBeVisible();

            // Check for auth buttons (when not logged in)
            await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
            await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible();
        });

        test('can navigate to pricing from landing page', async ({ page }) => {
            await page.goto('/');

            // Click pricing link in nav or CTA
            await page.getByRole('link', { name: /view pricing/i }).first().click();

            // Should be on pricing page
            await expect(page).toHaveURL(/\/pricing/);
        });

        test('can navigate to login from signup', async ({ page }) => {
            await page.goto('/signup');

            // Click login link
            await page.getByRole('link', { name: /log in/i }).click();

            // Should be on login page
            await expect(page).toHaveURL(/\/login/);
        });

        test('can navigate to signup from login', async ({ page }) => {
            await page.goto('/login');

            // Click signup link (use first to avoid strict mode violation)
            await page.getByRole('link', { name: /sign up/i }).first().click();

            // Should be on signup page
            await expect(page).toHaveURL(/\/signup/);
            await expect(page.getByRole('heading', { name: /create an account/i })).toBeVisible();
        });
    });


    test.describe('Responsive Design', () => {
        test('landing page is responsive on mobile', async ({ page }) => {
            await page.setViewportSize({ width: 375, height: 667 });
            await page.goto('/');

            // Hero should still be visible
            await expect(page.getByRole('heading', { name: /turn your thoughts/i })).toBeVisible();
        });

        test('pricing page is responsive on tablet', async ({ page }) => {
            // Set tablet viewport
            await page.setViewportSize({ width: 768, height: 1024 });
            await page.goto('/pricing');

            // All tiers should be visible (use headings for reliability)
            await expect(page.getByRole('heading', { name: /free/i })).toBeVisible();
            await expect(page.getByRole('heading', { name: /pro/i })).toBeVisible();
            await expect(page.getByRole('heading', { name: /business/i })).toBeVisible();
        });
    });

    test.describe('Performance', () => {
        test('landing page loads within reasonable time', async ({ page }) => {
            const startTime = Date.now();
            await page.goto('/');
            const loadTime = Date.now() - startTime;

            // Should load within 3 seconds
            expect(loadTime).toBeLessThan(3000);
        });

        test('pricing page loads within reasonable time', async ({ page }) => {
            const startTime = Date.now();
            await page.goto('/pricing');
            const loadTime = Date.now() - startTime;

            // Should load within 3 seconds
            expect(loadTime).toBeLessThan(3000);
        });
    });

    test.describe('SEO and Accessibility', () => {
        test('landing page has proper title', async ({ page }) => {
            await page.goto('/');

            const title = await page.title();
            expect(title).toContain('SteadyLetters');
        });

        test('pages have proper headings hierarchy', async ({ page }) => {
            await page.goto('/');

            // Should have H1
            const h1 = page.locator('h1');
            await expect(h1).toHaveCount(1);
        });

        test('forms have proper labels', async ({ page }) => {
            await page.goto('/login');

            // Email input should have label
            await expect(page.getByLabel(/email/i)).toBeVisible();

            // Password input should have label
            await expect(page.getByLabel(/password/i)).toBeVisible();
        });
    });
});
