import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration
 * Supports testing against both local and production environments
 * 
 * Test against local (default):
 *   npx playwright test
 * 
 * Test against production:
 *   TEST_ENV=production npx playwright test
 * 
 * Run both environments:
 *   npx playwright test --project=local && TEST_ENV=production npx playwright test --project=production
 */

const isProduction = process.env.TEST_ENV === 'production';
const baseURL = isProduction 
    ? 'https://www.steadyletters.com'
    : 'http://localhost:3000';

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',

    use: {
        baseURL,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },

    projects: [
        {
            name: 'local',
            use: { 
                ...devices['Desktop Chrome'],
                baseURL: 'http://localhost:3000',
            },
        },
        {
            name: 'production',
            use: { 
                ...devices['Desktop Chrome'],
                baseURL: 'https://www.steadyletters.com',
            },
        },
    ],

    webServer: isProduction ? undefined : {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
    },
});
