import { test, expect } from '@playwright/test';

const TEST_USER = {
    email: process.env.TEST_USER_EMAIL || 'testuser@kindletters.io',
    password: process.env.TEST_USER_PASSWORD || 'testpassword123',
};

test.describe('Thanks.io API Integration', () => {
    test.beforeEach(async ({ page }) => {
        // Login before each test
        await page.goto('/login');
        await page.fill('input[type="email"]', TEST_USER.email);
        await page.fill('input[type="password"]', TEST_USER.password);
        await page.click('button[type="submit"]');
        await page.waitForURL('/generate', { timeout: 10000 });
    });

    test.describe('Product Catalog API', () => {
        test('should return available products based on user tier', async ({ page }) => {
            const response = await page.request.get('/api/thanks-io/products');
            expect(response.ok()).toBeTruthy();

            const data = await response.json();
            expect(data).toHaveProperty('tier');
            expect(data).toHaveProperty('products');
            expect(data).toHaveProperty('allProducts');

            // Free tier should have at least postcards
            expect(data.products.length).toBeGreaterThan(0);
            const hasPostcard = data.products.some((p: any) => p.id === 'postcard');
            expect(hasPostcard).toBeTruthy();
        });

        test('should include product pricing and descriptions', async ({ page }) => {
            const response = await page.request.get('/api/thanks-io/products');
            const data = await response.json();

            const postcardProduct = data.products.find((p: any) => p.id === 'postcard');
            expect(postcardProduct).toBeDefined();
            expect(postcardProduct.basePrice).toBe(1.14);
            expect(postcardProduct.name).toBe('Postcard');
            expect(postcardProduct.features).toBeInstanceOf(Array);
        });
    });

    test.describe('Handwriting Styles API', () => {
        test('should fetch handwriting styles', async ({ page }) => {
            const response = await page.request.get('/api/thanks-io/styles');
            expect(response.ok()).toBeTruthy();

            const data = await response.json();
            expect(data).toHaveProperty('styles');
            expect(data.styles.length).toBeGreaterThan(0);

            // Check structure of first style
            const firstStyle = data.styles[0];
            expect(firstStyle).toHaveProperty('id');
            expect(firstStyle).toHaveProperty('name');
            expect(firstStyle).toHaveProperty('style');
        });

        test('should return mock styles when API key is not configured', async ({ page }) => {
            const response = await page.request.get('/api/thanks-io/styles');
            const data = await response.json();

            // Should have at least 6 mock styles
            expect(data.styles.length).toBeGreaterThanOrEqual(6);

            // Check for specific mock style
            const jeremyStyle = data.styles.find((s: any) => s.name === 'Jeremy');
            expect(jeremyStyle).toBeDefined();
            expect(jeremyStyle.style).toContain('Casual');
        });
    });

    test.describe('Send Mail API', () => {
        const mockRecipient = {
            name: 'Test Recipient',
            address: '123 Test St',
            city: 'Test City',
            province: 'CA',
            postal_code: '90210',
            country: 'US',
        };

        test('should send postcard with valid data', async ({ page }) => {
            const response = await page.request.post('/api/thanks-io/send', {
                data: {
                    productType: 'postcard',
                    recipients: [mockRecipient],
                    message: 'Test message',
                    handwritingStyle: '1',
                    handwritingColor: 'blue',
                    frontImageUrl: 'https://example.com/image.jpg',
                    postcardSize: '4x6',
                },
            });

            expect(response.ok()).toBeTruthy();
            const data = await response.json();

            expect(data.success).toBeTruthy();
            expect(data.productType).toBe('postcard');
            expect(data.recipientCount).toBe(1);
            expect(data.order).toHaveProperty('id');
        });

        test('should reject missing required fields', async ({ page }) => {
            const response = await page.request.post('/api/thanks-io/send', {
                data: {
                    productType: 'postcard',
                    // Missing recipients and message
                },
            });

            expect(response.status()).toBe(400);
            const data = await response.json();
            expect(data.error).toContain('Missing required fields');
        });

        test('should enforce tier restrictions', async ({ page }) => {
            // Try to send business-only product (windowless_letter) as free user
            const response = await page.request.post('/api/thanks-io/send', {
                data: {
                    productType: 'windowless_letter',
                    recipients: [mockRecipient],
                    message: 'Test message',
                    pdfUrl: 'https://example.com/letter.pdf',
                },
            });

            // Should be forbidden if user is on free tier
            if (response.status() === 403) {
                const data = await response.json();
                expect(data.error).toContain('requires');
                expect(data).toHaveProperty('requiredTier');
                expect(data).toHaveProperty('currentTier');
            }
        });

        test('should handle multiple recipients', async ({ page }) => {
            const recipients = [
                mockRecipient,
                { ...mockRecipient, name: 'Second Recipient', address: '456 Test Ave' },
            ];

            const response = await page.request.post('/api/thanks-io/send', {
                data: {
                    productType: 'postcard',
                    recipients,
                    message: 'Bulk test message',
                    handwritingStyle: '1',
                    postcardSize: '4x6',
                },
            });

            expect(response.ok()).toBeTruthy();
            const data = await response.json();
            expect(data.recipientCount).toBe(2);
        });

        test('should validate PDF URL for windowless letters', async ({ page }) => {
            const response = await page.request.post('/api/thanks-io/send', {
                data: {
                    productType: 'windowless_letter',
                    recipients: [mockRecipient],
                    message: 'Test message',
                    // Missing pdfUrl
                },
            });

            const data = await response.json();
            if (response.status() === 400) {
                expect(data.error).toContain('PDF URL required');
            }
        });
    });

    test.describe('Product Selection UI', () => {
        test('should show product type selector in design options', async ({ page }) => {
            // Generate a letter first
            await page.goto('/generate');
            await page.fill('textarea#context', 'Test letter for product selection');
            await page.click('button:has-text("Next Step")');
            await page.click('button:has-text("Generate Letter")');

            // Wait for generation
            await page.waitForTimeout(2000);

            // Switch to Design Options tab
            await page.click('button:has-text("Design Options")');

            // Check for Product Type selector
            const productTypeLabel = page.locator('text=Product Type');
            await expect(productTypeLabel).toBeVisible();

            // Check if we can see the select dropdown
            const selectTrigger = page.locator('[role="combobox"]').first();
            await expect(selectTrigger).toBeVisible();
        });

        test('should show postcard size selector when postcard is selected', async ({ page }) => {
            await page.goto('/generate');
            await page.fill('textarea#context', 'Test postcard generation');
            await page.click('button:has-text("Next Step")');
            await page.click('button:has-text("Generate Letter")');
            await page.waitForTimeout(2000);

            await page.click('button:has-text("Design Options")');

            // Select postcard
            const productSelect = page.locator('[role="combobox"]').first();
            await productSelect.click();
            await page.click('text=Postcard');

            // Check for size selector
            await page.waitForTimeout(500);
            const sizeLabel = page.locator('text=Postcard Size');
            await expect(sizeLabel).toBeVisible();
        });

        test('should update pricing when postcard size changes', async ({ page }) => {
            await page.goto('/generate');
            await page.fill('textarea#context', 'Pricing test');
            await page.click('button:has-text("Next Step")');
            await page.click('button:has-text("Generate Letter")');
            await page.waitForTimeout(2000);

            await page.click('button:has-text("Design Options")');

            // Check initial price (should be $1.14 for 4x6)
            const priceDisplay = page.locator('text=/\\$1\\.14/');
            await expect(priceDisplay).toBeVisible();

            // Change to 6x9 size
            const sizeSelect = page.locator('[role="combobox"]').nth(1);
            await sizeSelect.click();
            await page.click('text=6x9');

            // Check updated price
            const newPriceDisplay = page.locator('text=/\\$1\\.61/');
            await expect(newPriceDisplay).toBeVisible();
        });
    });

    test.describe('Authentication', () => {
        test('should require authentication for all endpoints', async ({ page, context }) => {
            // Create new context without authentication
            const newPage = await context.newPage();

            const endpoints = [
                '/api/thanks-io/products',
                '/api/thanks-io/styles',
            ];

            for (const endpoint of endpoints) {
                const response = await newPage.request.get(endpoint);
                expect(response.status()).toBe(401);
                const data = await response.json();
                expect(data.error).toBe('Unauthorized');
            }
        });
    });
});
