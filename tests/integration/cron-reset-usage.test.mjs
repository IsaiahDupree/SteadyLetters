/**
 * Integration Test Suite for Scheduled Usage Reset Cron Job
 *
 * Tests the monthly usage counter reset endpoint that should be called
 * by Vercel Cron on the 1st of each month
 *
 * Run with server running: npm run dev
 */

import { describe, test, expect, beforeAll } from '@jest/globals';

const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

beforeAll(async () => {
  console.log('\n🔍 Testing cron endpoint at:', baseUrl);

  // Check if server is running
  try {
    await fetch(baseUrl);
    console.log('✅ Server is running\n');
  } catch (error) {
    console.error('❌ Server is not running. Start it with: npm run dev');
    throw new Error('Server not accessible');
  }
});

describe('Cron Reset Usage Endpoint', () => {
  describe('Authentication', () => {
    test('should reject request without authorization header when CRON_SECRET is set', async () => {
      // Skip if CRON_SECRET is not set in environment
      if (!process.env.CRON_SECRET) {
        console.log('⏭️  Skipping auth test - CRON_SECRET not set in test environment');
        return;
      }

      const response = await fetch(`${baseUrl}/api/cron/reset-usage`, {
        method: 'GET',
        headers: {},
      });

      if (response.status !== 401) {
        const body = await response.text();
        console.error('Unexpected response:', body);
      }

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });

    test('should reject request with invalid secret', async () => {
      // Skip if CRON_SECRET is not set in environment
      if (!process.env.CRON_SECRET) {
        console.log('⏭️  Skipping auth test - CRON_SECRET not set in test environment');
        return;
      }

      const response = await fetch(`${baseUrl}/api/cron/reset-usage`, {
        method: 'GET',
        headers: {
          authorization: 'Bearer wrong-secret-invalid-12345',
        },
      });

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });
  });

  describe('Endpoint Response', () => {
    test('should return success response with valid structure', async () => {
      const headers = {};

      // Add authorization if CRON_SECRET is set
      if (process.env.CRON_SECRET) {
        headers.authorization = `Bearer ${process.env.CRON_SECRET}`;
      }

      const response = await fetch(`${baseUrl}/api/cron/reset-usage`, {
        method: 'GET',
        headers,
      });

      if (response.status !== 200) {
        const body = await response.text();
        console.error('Unexpected error response:', body);
      }

      expect(response.status).toBe(200);

      const body = await response.json();

      // Verify response structure
      expect(body).toHaveProperty('success');
      expect(body).toHaveProperty('usersReset');
      expect(body).toHaveProperty('resetAt');
      expect(body).toHaveProperty('nextResetDate');

      expect(body.success).toBe(true);
      expect(typeof body.usersReset).toBe('number');
      expect(body.usersReset).toBeGreaterThanOrEqual(0);

      console.log(`✅ Reset completed for ${body.usersReset} users`);
    });

    test('should return valid ISO timestamps', async () => {
      const headers = {};

      if (process.env.CRON_SECRET) {
        headers.authorization = `Bearer ${process.env.CRON_SECRET}`;
      }

      const response = await fetch(`${baseUrl}/api/cron/reset-usage`, {
        method: 'GET',
        headers,
      });

      const body = await response.json();

      // Verify resetAt is a valid ISO string
      expect(() => new Date(body.resetAt)).not.toThrow();
      expect(body.resetAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

      // Verify nextResetDate is a valid ISO string
      expect(() => new Date(body.nextResetDate)).not.toThrow();
      expect(body.nextResetDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

      // Verify nextResetDate is the 1st of next month
      const nextReset = new Date(body.nextResetDate);
      expect(nextReset.getUTCDate()).toBe(1);
      expect(nextReset.getUTCHours()).toBe(0);
      expect(nextReset.getUTCMinutes()).toBe(0);
      expect(nextReset.getUTCSeconds()).toBe(0);
    });

    test('should be idempotent - safe to call multiple times', async () => {
      const headers = {};

      if (process.env.CRON_SECRET) {
        headers.authorization = `Bearer ${process.env.CRON_SECRET}`;
      }

      // Call twice
      const response1 = await fetch(`${baseUrl}/api/cron/reset-usage`, {
        method: 'GET',
        headers,
      });

      const response2 = await fetch(`${baseUrl}/api/cron/reset-usage`, {
        method: 'GET',
        headers,
      });

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      const body1 = await response1.json();
      const body2 = await response2.json();

      // Both should succeed
      expect(body1.success).toBe(true);
      expect(body2.success).toBe(true);

      // Both should reset the same or fewer users (since some might have been reset after the first call)
      expect(body2.usersReset).toBeLessThanOrEqual(body1.usersReset + 10); // Allow for new users created between calls
    });
  });

  describe('Error Handling', () => {
    test('should not return 500 server error', async () => {
      const headers = {};

      if (process.env.CRON_SECRET) {
        headers.authorization = `Bearer ${process.env.CRON_SECRET}`;
      }

      const response = await fetch(`${baseUrl}/api/cron/reset-usage`, {
        method: 'GET',
        headers,
      });

      if (response.status === 500) {
        const body = await response.text();
        console.error('❌ 500 ERROR on /api/cron/reset-usage');
        console.error('Response:', body);
      }

      expect(response.status).not.toBe(500);
    });
  });
});
