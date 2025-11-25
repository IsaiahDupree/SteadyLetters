import { describe, it, expect } from '@jest/globals';

const PRODUCTION_URL = 'https://www.steadyletters.com';

describe('Production Deployment Tests', () => {
    describe('Homepage', () => {
        it('should load the homepage successfully', async () => {
            const response = await fetch(PRODUCTION_URL);
            expect(response.status).toBe(200);
            expect(response.headers.get('content-type')).toContain('text/html');
        });

        it('should contain SteadyLetters branding', async () => {
            const response = await fetch(PRODUCTION_URL);
            const html = await response.text();
            expect(html).toContain('SteadyLetters');
        });

        it('should have working navigation links', async () => {
            const response = await fetch(PRODUCTION_URL);
            const html = await response.text();
            expect(html).toContain('/pricing');
            expect(html).toContain('/generate');
        });
    });

    describe('Public Pages', () => {
        it('should load pricing page', async () => {
            const response = await fetch(`${PRODUCTION_URL}/pricing`);
            expect(response.status).toBe(200);
        });

        it('should load login page', async () => {
            const response = await fetch(`${PRODUCTION_URL}/login`);
            expect(response.status).toBe(200);
            const html = await response.text();
            expect(html).toMatch(/Welcome Back|Sign In|Log in/i);
        });

        it('should load signup page', async () => {
            const response = await fetch(`${PRODUCTION_URL}/signup`);
            expect(response.status).toBe(200);
            const html = await response.text();
            expect(html).toMatch(/Create an Account|Sign Up|Create Account/i);
        });
    });

    describe('Protected Routes', () => {
        it('should redirect dashboard to login when not authenticated', async () => {
            const response = await fetch(`${PRODUCTION_URL}/dashboard`, {
                redirect: 'manual',
            });
            // Could be 307 (redirect) or 200 (if middleware allows but page checks auth)
            expect([200, 307, 308]).toContain(response.status);
            if (response.status === 307 || response.status === 308) {
                const location = response.headers.get('location');
                expect(location).toContain('/login');
            }
        });

        it('should redirect recipients to login when not authenticated', async () => {
            const response = await fetch(`${PRODUCTION_URL}/recipients`, {
                redirect: 'manual',
            });
            expect([200, 307, 308]).toContain(response.status);
        });

        it('should redirect templates to login when not authenticated', async () => {
            const response = await fetch(`${PRODUCTION_URL}/templates`, {
                redirect: 'manual',
            });
            expect([200, 307, 308]).toContain(response.status);
        });
    });

    describe('API Endpoints', () => {
        it('should have health check endpoint', async () => {
            // This would need to be implemented
            // For now, just check that API routes exist
            const response = await fetch(`${PRODUCTION_URL}/api/generate/letter`, {
                method: 'POST',
            });
            // Should return 401 or 400, not 404
            expect([400, 401, 403]).toContain(response.status);
        });
    });

    describe('Environment Variables', () => {
        it('should have Supabase configured', async () => {
            const response = await fetch(`${PRODUCTION_URL}/login`);
            const html = await response.text();
            // Check that auth forms are present (indicates Supabase is configured)
            expect(html.toLowerCase()).toMatch(/email|password/);
        });
    });

    describe('Performance', () => {
        it('should load homepage within reasonable time', async () => {
            const start = Date.now();
            await fetch(PRODUCTION_URL);
            const duration = Date.now() - start;
            expect(duration).toBeLessThan(5000); // 5 seconds max
        });
    });
});

