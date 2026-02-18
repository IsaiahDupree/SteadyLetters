/**
 * LIVE INTEGRATION TEST — Sends a REAL letter via Thanks.io
 *
 * ⚠️  This test spends real money. Enable with:
 *     THANKS_IO_LIVE_TEST=true npm run test:live
 */

import { LIVE_TEST_CONFIG, assertLiveTestEnabled } from './config';

const API_KEY = LIVE_TEST_CONFIG.apiKey;
const BASE_URL = LIVE_TEST_CONFIG.baseUrl;

async function thanksIoRequest(endpoint: string, method: string, body?: Record<string, unknown>) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Thanks.io ${method} ${endpoint} failed (${res.status}): ${text}`);
  }

  return res.json();
}

describe('LIVE: Send Letter via Thanks.io', () => {
  beforeAll(() => {
    assertLiveTestEnabled();
    console.log('🚨 LIVE TEST MODE — Real letter will be sent and charged.');
  });

  test('should send a real handwritten letter', async () => {
    const recipient = LIVE_TEST_CONFIG.defaultRecipient;

    const payload = {
      handwriting_style: LIVE_TEST_CONFIG.defaultHandwritingStyle,
      handwriting_color: LIVE_TEST_CONFIG.defaultHandwritingColor,
      message: `Dear ${recipient.name},\n\n${LIVE_TEST_CONFIG.defaultMessage}\n\nTest ID: ${Date.now()}\nTimestamp: ${new Date().toISOString()}\n\nWarm regards,\nSteadyLetters iOS Test Suite`,
      recipients: [
        {
          name: recipient.name,
          address: recipient.address,
          city: recipient.city,
          province: recipient.province,
          postal_code: recipient.postal_code,
          country: recipient.country,
        },
      ],
    };

    console.log('   ✉️  Sending letter...');
    const result = await thanksIoRequest('/letters/send', 'POST', payload);

    expect(result).toBeDefined();
    const orderId = result.id || result.data?.id;
    expect(orderId).toBeDefined();

    const status = result.status || result.data?.status;
    console.log(`   ✅ Letter sent successfully!`);
    console.log(`   📋 Order ID: ${orderId}`);
    console.log(`   📊 Status: ${status}`);

    (global as Record<string, unknown>).__letterOrderId = orderId;
  }, 30000);

  test('should verify letter order exists', async () => {
    const orderId = (global as Record<string, unknown>).__letterOrderId as string;
    if (!orderId) {
      console.log('   ⏭️  Skipping — no order ID from previous test');
      return;
    }

    const result = await thanksIoRequest(`/orders/${orderId}`, 'GET');
    expect(result).toBeDefined();
    console.log(`   📊 Letter order ${orderId} status: ${result.status || result.data?.status}`);
  }, 15000);
});
