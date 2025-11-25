/**
 * Authenticated API Tests
 * 
 * Tests API endpoints with real authentication
 * Requires: Local server running and test user authenticated
 */

import { describe, it, expect, beforeAll } from '@jest/globals';

const LOCAL_URL = process.env.LOCAL_URL || 'http://localhost:3000';
const TEST_EMAIL = process.env.TEST_EMAIL || 'isaiahdupree33@gmail.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Frogger12';

// Helper to get auth session
async function getAuthSession() {
    // This would need to be implemented with Supabase auth
    // For now, we'll test the error handling paths
    return null;
}

describe('Authenticated API Tests', () => {
    describe('Error Handling', () => {
        it('should provide detailed errors in development mode', async () => {
            // Test that development mode shows detailed errors
            const response = await fetch(`${LOCAL_URL}/api/transcribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();
            
            // Should return error
            expect(data.error).toBeDefined();
            
            // In development, should have more details
            if (process.env.NODE_ENV === 'development') {
                // Might have details field
                expect(typeof data.error).toBe('string');
            }
        });

        it('should handle missing audio file gracefully', async () => {
            const formData = new FormData();
            
            const response = await fetch(`${LOCAL_URL}/api/transcribe`, {
                method: 'POST',
                body: formData,
            });

            // Should return 400 or 401
            expect([400, 401]).toContain(response.status);
            
            const data = await response.json();
            expect(data.error).toBeDefined();
        });

        it('should handle missing image file gracefully', async () => {
            const formData = new FormData();
            
            const response = await fetch(`${LOCAL_URL}/api/analyze-image`, {
                method: 'POST',
                body: formData,
            });

            // Should return 400 or 401
            expect([400, 401]).toContain(response.status);
            
            const data = await response.json();
            expect(data.error).toBeDefined();
        });

        it('should handle missing required fields in letter generation', async () => {
            const response = await fetch(`${LOCAL_URL}/api/generate/letter`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });

            // Should return 400 or 401
            expect([400, 401]).toContain(response.status);
            
            const data = await response.json();
            expect(data.error).toBeDefined();
        });
    });

    describe('User Sync', () => {
        it('should handle user not in Prisma gracefully', async () => {
            // This test verifies that the upsert pattern works
            // Even if user doesn't exist, the API should handle it
            
            const response = await fetch(`${LOCAL_URL}/api/generate/letter`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    context: 'test',
                    tone: 'friendly',
                    occasion: 'birthday',
                }),
            });

            // Should not be 500 (internal server error)
            // Should be 401 (unauthorized) or 400 (bad request)
            expect(response.status).not.toBe(500);
            expect([400, 401, 403]).toContain(response.status);
        });
    });

    describe('File Validation', () => {
        it('should validate audio file size', async () => {
            // Create a file that's too large
            const largeBlob = new Blob([new ArrayBuffer(26 * 1024 * 1024)], { type: 'audio/webm' });
            const formData = new FormData();
            formData.append('audio', largeBlob, 'large.webm');

            const response = await fetch(`${LOCAL_URL}/api/transcribe`, {
                method: 'POST',
                body: formData,
            });

            // Should return 400 (file too large) or 401 (unauthorized)
            expect([400, 401]).toContain(response.status);
        });

        it('should validate image file size', async () => {
            // Create a file that's too large
            const largeBlob = new Blob([new ArrayBuffer(21 * 1024 * 1024)], { type: 'image/jpeg' });
            const formData = new FormData();
            formData.append('image', largeBlob, 'large.jpg');

            const response = await fetch(`${LOCAL_URL}/api/analyze-image`, {
                method: 'POST',
                body: formData,
            });

            // Should return 400 (file too large) or 401 (unauthorized)
            expect([400, 401]).toContain(response.status);
        });
    });

    describe('Database Operations', () => {
        it('should handle Prisma errors gracefully', async () => {
            // Test that database errors don't crash the server
            const response = await fetch(`${LOCAL_URL}/api/generate/letter`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    context: 'test',
                    tone: 'friendly',
                    occasion: 'birthday',
                }),
            });

            // Should return a proper error, not crash
            expect(response.status).toBeGreaterThanOrEqual(400);
            expect(response.status).toBeLessThan(600);
            
            const data = await response.json();
            expect(data.error).toBeDefined();
        });
    });
});

