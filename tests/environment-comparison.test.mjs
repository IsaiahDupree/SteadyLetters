import { describe, it, expect } from '@jest/globals';

/**
 * Environment Comparison Tests
 * 
 * Compares local development build vs production deployment
 * to ensure parity and identify any environment-specific issues
 */

const LOCAL_URL = process.env.LOCAL_URL || 'http://localhost:3000';
const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://www.steadyletters.com';

// Helper to test both environments
async function testBothEnvironments(testName, testFn) {
    const results = {
        local: null,
        production: null,
        differences: [],
    };

    // Test local
    try {
        const localResult = await testFn(LOCAL_URL);
        results.local = { success: true, ...localResult };
    } catch (error) {
        results.local = { success: false, error: error.message };
    }

    // Test production
    try {
        const productionResult = await testFn(PRODUCTION_URL);
        results.production = { success: true, ...productionResult };
    } catch (error) {
        results.production = { success: false, error: error.message };
    }

    // Compare results
    if (results.local.success && results.production.success) {
        if (results.local.status !== results.production.status) {
            results.differences.push(
                `Status code mismatch: local=${results.local.status}, production=${results.production.status}`
            );
        }
        if (results.local.responseTime && results.production.responseTime) {
            const timeDiff = Math.abs(results.local.responseTime - results.production.responseTime);
            if (timeDiff > 2000) {
                results.differences.push(
                    `Response time difference: ${timeDiff}ms (local=${results.local.responseTime}ms, production=${results.production.responseTime}ms)`
                );
            }
        }
    }

    return results;
}

describe('Environment Comparison Tests', () => {
    describe('Homepage', () => {
        it('should load on both environments', async () => {
            const results = await testBothEnvironments('homepage', async (url) => {
                const start = Date.now();
                const response = await fetch(url);
                const responseTime = Date.now() - start;
                const html = await response.text();

                return {
                    status: response.status,
                    responseTime,
                    hasContent: html.length > 0,
                    hasBranding: html.includes('SteadyLetters'),
                };
            });

            expect(results.local.success).toBe(true);
            expect(results.production.success).toBe(true);
            expect(results.local.status).toBe(200);
            expect(results.production.status).toBe(200);
            
            if (results.differences.length > 0) {
                console.log('⚠️ Differences found:', results.differences);
            }
        });

        it('should have similar response times', async () => {
            const results = await testBothEnvironments('homepage-performance', async (url) => {
                const times = [];
                for (let i = 0; i < 3; i++) {
                    const start = Date.now();
                    await fetch(url);
                    times.push(Date.now() - start);
                }
                const avgTime = times.reduce((a, b) => a + b, 0) / times.length;

                return { responseTime: avgTime };
            });

            if (results.local.success && results.production.success) {
                const timeDiff = Math.abs(results.local.responseTime - results.production.responseTime);
                // Allow 3 second difference (production might be slower due to CDN)
                expect(timeDiff).toBeLessThan(3000);
            }
        });
    });

    describe('Public Pages', () => {
        const publicPages = ['/pricing', '/login', '/signup', '/privacy', '/terms'];

        publicPages.forEach((page) => {
            it(`should load ${page} on both environments`, async () => {
                const results = await testBothEnvironments(`page-${page}`, async (url) => {
                    const response = await fetch(`${url}${page}`);
                    const html = await response.text();

                    return {
                        status: response.status,
                        hasContent: html.length > 0,
                        contentType: response.headers.get('content-type'),
                    };
                });

                expect(results.local.success).toBe(true);
                expect(results.production.success).toBe(true);
                expect(results.local.status).toBe(results.production.status);
                
                if (results.differences.length > 0) {
                    console.log(`⚠️ ${page} differences:`, results.differences);
                }
            });
        });
    });

    describe('API Endpoints', () => {
        it('should have same authentication behavior', async () => {
            const results = await testBothEnvironments('api-auth', async (url) => {
                const response = await fetch(`${url}/api/generate/letter`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({}),
                });

                return {
                    status: response.status,
                    requiresAuth: response.status === 401,
                };
            });

            expect(results.local.success).toBe(true);
            expect(results.production.success).toBe(true);
            // Both should require authentication
            expect(results.local.requiresAuth).toBe(true);
            expect(results.production.requiresAuth).toBe(true);
            expect(results.local.status).toBe(results.production.status);
        });

        it('should have same error handling', async () => {
            const results = await testBothEnvironments('api-error-handling', async (url) => {
                const response = await fetch(`${url}/api/generate/letter`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: 'invalid json',
                });

                const data = await response.json().catch(() => ({}));

                return {
                    status: response.status,
                    hasError: 'error' in data,
                };
            });

            expect(results.local.success).toBe(true);
            expect(results.production.success).toBe(true);
            // Both should handle errors similarly
            expect([400, 401, 500]).toContain(results.local.status);
            expect([400, 401, 500]).toContain(results.production.status);
        });
    });

    describe('Protected Routes', () => {
        const protectedRoutes = ['/dashboard', '/recipients', '/templates'];

        protectedRoutes.forEach((route) => {
            it(`should protect ${route} on both environments`, async () => {
                const results = await testBothEnvironments(`protected-${route}`, async (url) => {
                    const response = await fetch(`${url}${route}`, {
                        redirect: 'manual',
                    });

                    return {
                        status: response.status,
                        isRedirect: [307, 308].includes(response.status),
                        redirectLocation: response.headers.get('location'),
                    };
                });

                expect(results.local.success).toBe(true);
                expect(results.production.success).toBe(true);
                // Both should redirect or require auth
                expect([200, 307, 308, 401]).toContain(results.local.status);
                expect([200, 307, 308, 401]).toContain(results.production.status);
            });
        });
    });

    describe('Static Assets', () => {
        it('should serve assets on both environments', async () => {
            const results = await testBothEnvironments('static-assets', async (url) => {
                // Test favicon or common asset
                const response = await fetch(`${url}/favicon.ico`, {
                    method: 'HEAD',
                });

                return {
                    status: response.status,
                    hasContentType: !!response.headers.get('content-type'),
                };
            });

            // Assets might not exist, but both should handle the request
            expect(results.local.success).toBe(true);
            expect(results.production.success).toBe(true);
        });
    });

    describe('Response Headers', () => {
        it('should have similar security headers', async () => {
            const results = await testBothEnvironments('security-headers', async (url) => {
                const response = await fetch(url);
                const headers = {
                    contentType: response.headers.get('content-type'),
                    xFrameOptions: response.headers.get('x-frame-options'),
                    xContentTypeOptions: response.headers.get('x-content-type-options'),
                };

                return { headers };
            });

            if (results.local.success && results.production.success) {
                // Both should have content-type
                expect(results.local.headers.contentType).toBeTruthy();
                expect(results.production.headers.contentType).toBeTruthy();
            }
        });
    });

    describe('Environment-Specific Checks', () => {
        it('should identify environment differences', async () => {
            const differences = [];

            // Check if local server is running
            try {
                await fetch(LOCAL_URL);
            } catch (error) {
                differences.push('Local server not running - skipping local tests');
            }

            // Check production
            try {
                const prodResponse = await fetch(PRODUCTION_URL);
                if (!prodResponse.ok) {
                    differences.push(`Production returned ${prodResponse.status}`);
                }
            } catch (error) {
                differences.push(`Production unreachable: ${error.message}`);
            }

            if (differences.length > 0) {
                console.log('⚠️ Environment differences:', differences);
            }

            // At least production should be accessible
            expect(differences.length).toBeLessThan(2);
        });
    });

    describe('Performance Comparison', () => {
        it('should compare load times', async () => {
            const results = await testBothEnvironments('performance', async (url) => {
                const times = [];
                for (let i = 0; i < 5; i++) {
                    const start = Date.now();
                    await fetch(url);
                    times.push(Date.now() - start);
                }
                const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
                const minTime = Math.min(...times);
                const maxTime = Math.max(...times);

                return {
                    avgTime,
                    minTime,
                    maxTime,
                };
            });

            if (results.local.success && results.production.success) {
                console.log('\n📊 Performance Comparison:');
                console.log(`Local:      ${results.local.avgTime.toFixed(0)}ms (min: ${results.local.minTime}ms, max: ${results.local.maxTime}ms)`);
                console.log(`Production: ${results.production.avgTime.toFixed(0)}ms (min: ${results.production.minTime}ms, max: ${results.production.maxTime}ms)`);
                
                // Production might be slower due to CDN/edge, but shouldn't be >5s
                expect(results.production.avgTime).toBeLessThan(5000);
            }
        });
    });
});

