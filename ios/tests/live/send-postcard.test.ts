/**
 * LIVE INTEGRATION TEST — Sends a REAL postcard via Thanks.io
 *
 * ⚠️  This test spends real money. Enable with:
 *     THANKS_IO_LIVE_TEST=true npm run test:live
 *
 * Required env vars:
 *   THANKS_IO_API_KEY or EXPO_PUBLIC_THANKS_IO_API_KEY
 *   THANKS_IO_LIVE_TEST=true
 *
 * Optional env vars:
 *   LIVE_TEST_RECIPIENT_NAME, LIVE_TEST_RECIPIENT_ADDRESS,
 *   LIVE_TEST_RECIPIENT_CITY, LIVE_TEST_RECIPIENT_STATE,
 *   LIVE_TEST_RECIPIENT_ZIP, LIVE_TEST_MAX_SPEND
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

describe('LIVE: Send Postcard via Thanks.io', () => {
  beforeAll(() => {
    assertLiveTestEnabled();
    console.log('🚨 LIVE TEST MODE — Real postcard will be sent and charged.');
    console.log(`   Recipient: ${LIVE_TEST_CONFIG.defaultRecipient.name}`);
    console.log(`   Address:   ${LIVE_TEST_CONFIG.defaultRecipient.address}, ${LIVE_TEST_CONFIG.defaultRecipient.city}, ${LIVE_TEST_CONFIG.defaultRecipient.province} ${LIVE_TEST_CONFIG.defaultRecipient.postal_code}`);
    console.log(`   Max Spend: $${LIVE_TEST_CONFIG.maxSpend.toFixed(2)}`);
  });

  test('should retrieve handwriting styles', async () => {
    const data = await thanksIoRequest('/handwriting-styles', 'GET');
    expect(data).toBeDefined();
    expect(Array.isArray(data.data || data)).toBe(true);
    console.log(`   ✅ Retrieved ${(data.data || data).length} handwriting styles`);
  });

  test('should send a real postcard', async () => {
    const recipient = LIVE_TEST_CONFIG.defaultRecipient;

    const payload = {
      front_image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      handwriting_style: LIVE_TEST_CONFIG.defaultHandwritingStyle,
      handwriting_color: LIVE_TEST_CONFIG.defaultHandwritingColor,
      message: `${LIVE_TEST_CONFIG.defaultMessage}\n\nTest ID: ${Date.now()}\nTimestamp: ${new Date().toISOString()}`,
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

    console.log('   📮 Sending postcard...');
    const result = await thanksIoRequest('/postcards/send', 'POST', payload);

    expect(result).toBeDefined();
    expect(result.id || result.data?.id).toBeDefined();

    const orderId = result.id || result.data?.id;
    const status = result.status || result.data?.status;

    console.log(`   ✅ Postcard sent successfully!`);
    console.log(`   📋 Order ID: ${orderId}`);
    console.log(`   📊 Status: ${status}`);

    // Store for status check test
    (global as Record<string, unknown>).__postcardOrderId = orderId;
  }, 30000);

  test('should check order status', async () => {
    const orderId = (global as Record<string, unknown>).__postcardOrderId as string;
    if (!orderId) {
      console.log('   ⏭️  Skipping — no order ID from previous test');
      return;
    }

    const result = await thanksIoRequest(`/orders/${orderId}`, 'GET');
    expect(result).toBeDefined();
    console.log(`   📊 Order ${orderId} status: ${result.status || result.data?.status}`);
  }, 15000);
});
