/**
 * Thanks.io Live Integration Tests
 *
 * These tests make REAL API calls to Thanks.io and will:
 * - Charge your Thanks.io account for any sends
 * - Create actual mail orders
 *
 * ONLY run these manually. They are guarded by the THANKS_IO_LIVE_TEST env flag.
 *
 * Usage:
 *   THANKS_IO_LIVE_TEST=true npx jest tests/integration/thanks-io-live.test.ts --testTimeout=30000
 *
 * To run without sending (validates API key and styles only):
 *   THANKS_IO_LIVE_TEST=true THANKS_IO_SKIP_SEND=true npx jest tests/integration/thanks-io-live.test.ts
 */

import { describe, test, expect, beforeAll } from '@jest/globals';

const LIVE_TEST = process.env.THANKS_IO_LIVE_TEST === 'true';
const SKIP_SEND = process.env.THANKS_IO_SKIP_SEND === 'true';
const API_KEY = process.env.THANKS_IO_API_KEY;
const BASE_URL = 'https://api.thanks.io/api/v2';

// Test recipient — a real deliverable address you control
const TEST_RECIPIENT = {
  name: 'Isaiah Dupree',
  address: '3425 Delaney Dr Apt 214',
  city: 'Melbourne',
  province: 'FL',
  postal_code: '32934',
  country: 'US',
};

const TEST_MESSAGE = 'SteadyLetters live integration test. Order created at: ' + new Date().toISOString();

// ============================================================================
// GUARD — skip entire suite if not opted in
// ============================================================================

if (!LIVE_TEST) {
  describe('Thanks.io Live Integration (SKIPPED)', () => {
    test('skipped — set THANKS_IO_LIVE_TEST=true to run', () => {
      console.log('ℹ️  Skipping live Thanks.io tests. Set THANKS_IO_LIVE_TEST=true to enable.');
      expect(true).toBe(true);
    });
  });
} else {

// ============================================================================
// LIVE TESTS
// ============================================================================

async function apiGet(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  });
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { status: res.status, ok: res.ok, data };
}

async function apiPost(path: string, body: Record<string, any>) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { status: res.status, ok: res.ok, data };
}

describe('Thanks.io Live Integration Tests', () => {

  beforeAll(() => {
    if (!API_KEY) {
      throw new Error('THANKS_IO_API_KEY is not set. Cannot run live tests.');
    }
    console.log('🚀 Running LIVE Thanks.io integration tests');
    console.log(`   Send step: ${SKIP_SEND ? 'SKIPPED (THANKS_IO_SKIP_SEND=true)' : 'ENABLED — real orders will be created'}`);
  });

  // --------------------------------------------------------------------------
  // 1. API Key & Connectivity
  // --------------------------------------------------------------------------

  describe('API Connectivity', () => {
    test('API key is set', () => {
      expect(API_KEY).toBeTruthy();
      expect(API_KEY!.length).toBeGreaterThan(50);
    });

    test('handwriting-styles endpoint returns 200', async () => {
      const { status, ok, data } = await apiGet('/handwriting-styles');
      expect(status).toBe(200);
      expect(ok).toBe(true);
      expect(data.data).toBeInstanceOf(Array);
      expect(data.data.length).toBeGreaterThan(0);
    });

    test('handwriting styles have required fields', async () => {
      const { data } = await apiGet('/handwriting-styles');
      const styles = data.data as any[];
      const first = styles[0];
      expect(first).toHaveProperty('handwriting_style_id');
      expect(first).toHaveProperty('sample');
    });
  });

  // --------------------------------------------------------------------------
  // 2. Postcard Send
  // --------------------------------------------------------------------------

  describe('Postcard Send', () => {
    let postcardOrderId: string | null = null;

    test('sends a 4x6 postcard successfully', async () => {
      if (SKIP_SEND) {
        console.log('  ⏭️  Skipped (THANKS_IO_SKIP_SEND=true)');
        return;
      }

      const { status, ok, data } = await apiPost('/postcard/send', {
        recipients: [TEST_RECIPIENT],
        message: TEST_MESSAGE,
        handwriting_style: '1',
        handwriting_color: 'blue',
        size: '4x6',
        front_image_url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800',
      });

      console.log(`  Postcard response (${status}):`, JSON.stringify(data).slice(0, 200));

      expect(status).toBe(200);
      expect(ok).toBe(true);

      const orderId = data.id || data.order_id;
      expect(orderId).toBeTruthy();
      postcardOrderId = orderId;

      console.log(`  ✅ Postcard order created: ${orderId}`);
    }, 30000);

    test('can check postcard order status', async () => {
      if (SKIP_SEND || !postcardOrderId) {
        console.log('  ⏭️  Skipped (no order ID)');
        return;
      }

      const { status, ok, data } = await apiGet(`/order/${postcardOrderId}`);

      console.log(`  Order status response (${status}):`, JSON.stringify(data).slice(0, 200));

      expect(status).toBe(200);
      expect(ok).toBe(true);
      expect(data).toHaveProperty('status');

      console.log(`  ✅ Order status: ${data.status}`);
    }, 15000);

    test('rejects postcard with missing required fields', async () => {
      const { status } = await apiPost('/postcard/send', {
        // Missing recipients and message
        handwriting_style: '1',
      });

      expect(status).toBeGreaterThanOrEqual(400);
      expect(status).toBeLessThan(500);
    }, 15000);
  });

  // --------------------------------------------------------------------------
  // 3. Letter Send
  // --------------------------------------------------------------------------

  describe('Letter Send', () => {
    let letterOrderId: string | null = null;

    test('sends a windowed letter successfully', async () => {
      if (SKIP_SEND) {
        console.log('  ⏭️  Skipped (THANKS_IO_SKIP_SEND=true)');
        return;
      }

      const { status, ok, data } = await apiPost('/letter/send', {
        recipients: [TEST_RECIPIENT],
        message: TEST_MESSAGE,
        handwriting_style: '1',
        handwriting_color: 'blue',
      });

      console.log(`  Letter response (${status}):`, JSON.stringify(data).slice(0, 200));

      expect(status).toBe(200);
      expect(ok).toBe(true);

      const orderId = data.id || data.order_id;
      expect(orderId).toBeTruthy();
      letterOrderId = orderId;

      console.log(`  ✅ Letter order created: ${orderId}`);
    }, 30000);

    test('can check letter order status', async () => {
      if (SKIP_SEND || !letterOrderId) {
        console.log('  ⏭️  Skipped (no order ID)');
        return;
      }

      const { status, ok, data } = await apiGet(`/order/${letterOrderId}`);

      expect(status).toBe(200);
      expect(ok).toBe(true);
      expect(data).toHaveProperty('status');

      console.log(`  ✅ Letter order status: ${data.status}`);
    }, 15000);
  });

  // --------------------------------------------------------------------------
  // 4. Greeting Card Send
  // --------------------------------------------------------------------------

  describe('Greeting Card Send', () => {
    test('sends a greeting card successfully', async () => {
      if (SKIP_SEND) {
        console.log('  ⏭️  Skipped (THANKS_IO_SKIP_SEND=true)');
        return;
      }

      const { status, ok, data } = await apiPost('/greeting/send', {
        recipients: [TEST_RECIPIENT],
        message: TEST_MESSAGE,
        handwriting_style: '1',
        handwriting_color: 'blue',
        front_image_url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800',
      });

      console.log(`  Greeting card response (${status}):`, JSON.stringify(data).slice(0, 200));

      expect(status).toBe(200);
      expect(ok).toBe(true);

      const orderId = data.id || data.order_id;
      expect(orderId).toBeTruthy();
      console.log(`  ✅ Greeting card order created: ${orderId}`);
    }, 30000);
  });

  // --------------------------------------------------------------------------
  // 5. Error Handling
  // --------------------------------------------------------------------------

  describe('Error Handling', () => {
    test('returns 401 with invalid API key', async () => {
      const res = await fetch(`${BASE_URL}/handwriting-styles`, {
        headers: {
          'Authorization': 'Bearer invalid_key_12345',
          'Accept': 'application/json',
        },
      });
      expect(res.status).toBe(401);
    }, 10000);

    test('returns 4xx for invalid recipient address', async () => {
      if (SKIP_SEND) {
        console.log('  ⏭️  Skipped (THANKS_IO_SKIP_SEND=true)');
        return;
      }

      const { status } = await apiPost('/postcard/send', {
        recipients: [{
          name: 'Invalid',
          address: '',
          city: '',
          province: '',
          postal_code: '',
          country: 'US',
        }],
        message: 'Test',
        handwriting_style: '1',
        size: '4x6',
      });

      expect(status).toBeGreaterThanOrEqual(400);
      expect(status).toBeLessThan(500);
    }, 15000);
  });

}); // end describe

} // end LIVE_TEST guard
