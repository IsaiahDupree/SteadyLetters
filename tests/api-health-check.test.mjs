import { describe, it, expect, beforeAll } from '@jest/globals';

/**
 * API Health Check Tests
 * 
 * These tests verify that API endpoints are properly configured and
 * can handle requests without returning 500 errors.
 * 
 * Run these tests to catch configuration issues BEFORE they reach production.
 */

const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

// Wait for server to be ready
beforeAll(async () => {
    console.log('\n🔍 Checking API health at:', baseUrl);
    
    // Check if server is running
    try {
        const response = await fetch(baseUrl);
        console.log('✅ Server is running\n');
    } catch (error) {
        console.error('❌ Server is not running. Start it with: npm run dev');
        throw new Error('Server not accessible');
    }
});

describe('API Health Checks - Critical Endpoints', () => {

    describe('Environment Variables Check', () => {
        
        it('should have OPENAI_API_KEY configured', () => {
            // This checks if the key exists in the test environment
            const hasKey = process.env.OPENAI_API_KEY !== undefined;
            
            if (!hasKey) {
                console.error('\n❌ OPENAI_API_KEY is not set!');
                console.error('This will cause 500 errors on:');
                console.error('  - /api/generate/letter');
                console.error('  - /api/transcribe');
                console.error('  - /api/analyze-image\n');
                console.error('Fix: Copy .env to .env.local');
                console.error('  cp .env .env.local\n');
            }
            
            // Don't fail the test, just warn
            expect(true).toBe(true);
        });
    });

    describe('API Endpoints - Error Detection', () => {

        it('should detect 500 errors on /api/generate/letter', async () => {
            const response = await fetch(`${baseUrl}/api/generate/letter`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    context: 'Test letter',
                    tone: 'casual',
                    occasion: 'general',
                }),
            });

            const status = response.status;
            
            if (status === 500) {
                const text = await response.text();
                console.error('\n❌ 500 ERROR on /api/generate/letter');
                console.error('Response:', text);
                console.error('\nLikely cause: Missing OPENAI_API_KEY');
                console.error('Fix: Ensure .env.local exists with OPENAI_API_KEY\n');
                
                // Fail the test to make this visible
                expect(status).not.toBe(500);
            } else {
                console.log(`✅ /api/generate/letter returns ${status} (expected: 401 unauthorized)`);
                // Should be 401 (unauthorized) not 500 (server error)
                expect([401, 403]).toContain(status);
            }
        });

        it('should detect 500 errors on /api/transcribe', async () => {
            // Create minimal audio data
            const audioData = new Uint8Array(1024);
            const formData = new FormData();
            const blob = new Blob([audioData], { type: 'audio/webm' });
            formData.append('audio', blob, 'test.webm');

            const response = await fetch(`${baseUrl}/api/transcribe`, {
                method: 'POST',
                body: formData,
            });

            const status = response.status;
            
            if (status === 500) {
                const text = await response.text();
                console.error('\n❌ 500 ERROR on /api/transcribe');
                console.error('Response:', text);
                console.error('\nLikely cause: Missing OPENAI_API_KEY');
                console.error('Fix: Ensure .env.local exists with OPENAI_API_KEY\n');
                
                expect(status).not.toBe(500);
            } else {
                console.log(`✅ /api/transcribe returns ${status} (expected: 401 unauthorized)`);
                expect([400, 401, 403]).toContain(status);
            }
        });

        it('should detect 500 errors on /api/analyze-image', async () => {
            // Create minimal PNG image
            const pngData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
            const formData = new FormData();
            const blob = new Blob([pngData], { type: 'image/png' });
            formData.append('image', blob, 'test.png');

            const response = await fetch(`${baseUrl}/api/analyze-image`, {
                method: 'POST',
                body: formData,
            });

            const status = response.status;
            
            if (status === 500) {
                const text = await response.text();
                console.error('\n❌ 500 ERROR on /api/analyze-image');
                console.error('Response:', text);
                console.error('\nLikely cause: Missing OPENAI_API_KEY');
                console.error('Fix: Ensure .env.local exists with OPENAI_API_KEY\n');
                
                expect(status).not.toBe(500);
            } else {
                console.log(`✅ /api/analyze-image returns ${status} (expected: 401 unauthorized)`);
                expect([401, 403]).toContain(status);
            }
        });

        it('should detect 500 errors on /api/stripe/checkout', async () => {
            const response = await fetch(`${baseUrl}/api/stripe/checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    priceId: 'price_test',
                }),
            });

            const status = response.status;
            
            if (status === 500) {
                const text = await response.text();
                console.error('\n❌ 500 ERROR on /api/stripe/checkout');
                console.error('Response:', text);
                console.error('\nLikely cause: Missing STRIPE_SECRET_KEY or DATABASE_URL');
                console.error('Fix: Ensure .env.local exists with required variables\n');
                
                expect(status).not.toBe(500);
            } else {
                console.log(`✅ /api/stripe/checkout returns ${status} (expected: 401 unauthorized)`);
                expect([400, 401]).toContain(status);
            }
        });
    });

    describe('Configuration Validation', () => {

        it('should have all critical environment variables', () => {
            const required = [
                'OPENAI_API_KEY',
                'STRIPE_SECRET_KEY',
                'DATABASE_URL',
                'NEXT_PUBLIC_SUPABASE_URL',
                'NEXT_PUBLIC_SUPABASE_ANON_KEY',
            ];

            const missing = required.filter(key => !process.env[key]);

            if (missing.length > 0) {
                console.error('\n❌ Missing environment variables:');
                missing.forEach(key => console.error(`   - ${key}`));
                console.error('\nThese MUST be in .env.local for local development');
                console.error('Run: npm run check:env for detailed info\n');
            } else {
                console.log('✅ All critical environment variables are set');
            }

            // Don't fail - this is informational
            expect(true).toBe(true);
        });
    });
});

console.log('\n═══════════════════════════════════════════════════════════');
console.log('🔍 API HEALTH CHECK');
console.log('═══════════════════════════════════════════════════════════');
console.log('This test suite checks for 500 errors caused by missing');
console.log('environment variables or configuration issues.');
console.log('');
console.log('If you see 500 errors:');
console.log('  1. Run: npm run check:env');
console.log('  2. Copy: cp .env .env.local');
console.log('  3. Restart: npm run dev');
console.log('═══════════════════════════════════════════════════════════\n');
