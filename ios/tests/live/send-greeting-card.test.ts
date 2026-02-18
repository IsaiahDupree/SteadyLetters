/**
 * LIVE INTEGRATION TEST — Sends a REAL greeting card via Thanks.io
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

describe('LIVE: Send Greeting Card via Thanks.io', () => {
  beforeAll(() => {
    assertLiveTestEnabled();
    console.log('🚨 LIVE TEST MODE — Real greeting card will be sent and charged.');
  });

  test('should send a real greeting card', async () => {
    const recipient = LIVE_TEST_CONFIG.defaultRecipient;

    const payload = {
      handwriting_style: LIVE_TEST_CONFIG.defaultHandwritingStyle,
      handwriting_color: LIVE_TEST_CONFIG.defaultHandwritingColor,
      message: `${LIVE_TEST_CONFIG.defaultMessage}\n\nGreeting Card Test ID: ${Date.now()}`,
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

    console.log('   🎉 Sending greeting card...');
    const result = await thanksIoRequest('/greeting-cards/send', 'POST', payload);

    expect(result).toBeDefined();
    const orderId = result.id || result.data?.id;
    expect(orderId).toBeDefined();

    console.log(`   ✅ Greeting card sent!`);
    console.log(`   📋 Order ID: ${orderId}`);
    console.log(`   📊 Status: ${result.status || result.data?.status}`);
  }, 30000);
});
