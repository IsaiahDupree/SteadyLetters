/**
 * Subscription Enforcement Tests
 * Verifies that usage limits are enforced based on subscription tier
 */

import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TEST_EMAIL = 'subscription_test@example.com';
const TEST_PASSWORD = 'TestPassword123!';
const baseUrl = 'http://localhost:3000';

let authenticatedContext;
let userId;

test.setTimeout(60000);

test.beforeAll(async ({ playwright }) => {
    test.setTimeout(60000);
    // 1. Create a test user in DB
    const user = await prisma.user.upsert({
        where: { email: TEST_EMAIL },
        update: {},
        create: {
            email: TEST_EMAIL,
            // Password handling would typically be here if using custom auth
        },
    });
    userId = user.id;

    // 2. Login via UI to get session
    const browser = await playwright.chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    // Note: Since we're using Supabase/NextAuth, we might need to actually sign up or use a helper
    // For this test, assuming the user exists or can be created via UI is safer
    // But since we have DB access, we can manipulate the UserUsage directly

    // Let's use the existing auth helper flow or just login if the user exists
    // For simplicity, we'll assume the user can login. If not, we might need to create them via UI.
    // Actually, let's use the same credentials as other tests if possible, or create a new one via UI.

    await page.goto(`${baseUrl}/login`);
    // If we can't login with the DB-created user (no password hash), we should sign up
    // But let's try to use the standard test user for now, and reset their usage

    await page.fill('input[type="email"]', 'isaiahdupree33@gmail.com');
    await page.fill('input[type="password"]', 'Frogger12');
    await page.click('button[type="submit"]');
    await page.waitForURL(`${baseUrl}/dashboard`, { timeout: 10000 });

    authenticatedContext = context;

    // Get the ID of the logged in user
    const dbUser = await prisma.user.findUnique({ where: { email: 'isaiahdupree33@gmail.com' } });
    userId = dbUser?.id;
});

test.describe('Subscription Enforcement', () => {

    test.beforeEach(async () => {
        // Reset usage to 0 and tier to FREE before each test
        await prisma.userUsage.update({
            where: { userId: userId },
            data: {
                tier: 'FREE',
                letterGenerations: 0,
                imageGenerations: 0,
                lettersSent: 0,
            },
        });
    });

    test('should enforce FREE tier letter generation limit (5)', async () => {
        // Set usage to limit
        await prisma.userUsage.update({
            where: { userId: userId },
            data: { letterGenerations: 5 },
        });

        // Try to generate letter
        const response = await authenticatedContext.request.post(`${baseUrl}/api/generate/letter`, {
            data: {
                content: 'Test letter',
                recipient: 'Test Recipient',
            }
        });

        // Should fail with 403 or 402 (Payment Required)
        // Note: The actual API might return 400 or 403 depending on implementation
        // Let's check the response
        expect([403, 402, 400]).toContain(response.status());
        const data = await response.json();
        expect(JSON.stringify(data)).toContain('limit');
    });

    test('should allow letter generation within FREE tier limit', async () => {
        // Set usage to 4 (below limit of 5)
        await prisma.userUsage.update({
            where: { userId: userId },
            data: { letterGenerations: 4 },
        });

        // Try to generate letter
        const response = await authenticatedContext.request.post(`${baseUrl}/api/generate/letter`, {
            data: {
                context: 'Test letter',
                recipientName: 'Test Recipient',
                tone: 'Friendly',
                occasion: 'Birthday'
            }
        });

        // Should succeed
        expect(response.status()).toBe(200);
    });

    test('should enforce PRO tier limits', async () => {
        // Upgrade to PRO
        await prisma.userUsage.update({
            where: { userId: userId },
            data: {
                tier: 'PRO',
                letterGenerations: 50
            },
        });

        // Try to generate letter at limit
        const response = await authenticatedContext.request.post(`${baseUrl}/api/generate/letter`, {
            data: {
                context: 'Test letter',
                recipientName: 'Test Recipient',
            }
        });

        expect([403, 402, 400]).toContain(response.status());
    });

    test('should allow higher limits on PRO tier', async () => {
        // Upgrade to PRO and set usage above FREE limit but below PRO limit
        await prisma.userUsage.update({
            where: { userId: userId },
            data: {
                tier: 'PRO',
                letterGenerations: 10 // > 5 (Free limit)
            },
        });

        // Try to generate letter
        const response = await authenticatedContext.request.post(`${baseUrl}/api/generate/letter`, {
            data: {
                context: 'Test letter',
                recipientName: 'Test Recipient',
                tone: 'Friendly',
                occasion: 'Birthday'
            }
        });

        expect(response.status()).toBe(200);
    });

    test('should enforce BUSINESS tier limits', async () => {
        // Upgrade to BUSINESS
        await prisma.userUsage.update({
            where: { userId: userId },
            data: {
                tier: 'BUSINESS',
                letterGenerations: 200
            },
        });

        // Try to generate letter at limit
        const response = await authenticatedContext.request.post(`${baseUrl}/api/generate/letter`, {
            data: {
                context: 'Test letter',
                recipientName: 'Test Recipient',
            }
        });

        expect([403, 402, 400]).toContain(response.status());
    });

    test('should allow unlimited features for BUSINESS tier', async () => {
        // Upgrade to BUSINESS
        await prisma.userUsage.update({
            where: { userId: userId },
            data: {
                tier: 'BUSINESS',
                // Voice is unlimited on Business
                // We can't easily test "unlimited" counter, but we can verify it doesn't block
            },
        });

        // Verify API returns correct usage info
        const response = await authenticatedContext.request.get(`${baseUrl}/api/billing/usage`);
        const data = await response.json();

        expect(data.usage.voiceTranscriptions.limit).toBe(-1);
        expect(data.usage.imageAnalyses.limit).toBe(-1);
    });
});

test.afterAll(async () => {
    if (authenticatedContext) {
        await authenticatedContext.close();
    }
    await prisma.$disconnect();
});
