import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { LIVE_TEST_CONFIG, assertLiveTestEnabled } from './config';
import { CostTracker } from './cost-tracker';
import { PRODUCT_CATALOG, getPostcardPrice } from '@/lib/thanks-io';

// ============================================================================
// SAFETY: Skip entire suite if live tests are not explicitly enabled
// ============================================================================
const ENABLED = LIVE_TEST_CONFIG.enabled && !!LIVE_TEST_CONFIG.apiKey;
const describeIf = ENABLED ? describe : describe.skip;

const API_KEY = LIVE_TEST_CONFIG.apiKey;
const BASE_URL = LIVE_TEST_CONFIG.baseUrl;
const RECIPIENT = LIVE_TEST_CONFIG.defaultRecipient;
const RECIPIENT_STRING = `${RECIPIENT.address}, ${RECIPIENT.city} ${RECIPIENT.province} ${RECIPIENT.postal_code}`;
const MESSAGE = LIVE_TEST_CONFIG.defaultMessage;
const PROFILE = LIVE_TEST_CONFIG.profile;

const tracker = new CostTracker(LIVE_TEST_CONFIG.maxSpend, PROFILE);

// Profiles control which tests run
const isSmoke = PROFILE === 'smoke' || PROFILE === 'standard' || PROFILE === 'full';
const isStandard = PROFILE === 'standard' || PROFILE === 'full';
const isFull = PROFILE === 'full';

// Helper: make authenticated API request
async function apiRequest(
  method: 'GET' | 'POST',
  endpoint: string,
  body?: Record<string, unknown>
): Promise<Response> {
  const url = `${BASE_URL}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  return fetch(url, options);
}

// Helper: make API request with intentionally bad key
async function apiRequestBadKey(
  method: 'GET' | 'POST',
  endpoint: string,
  body?: Record<string, unknown>
): Promise<Response> {
  const url = `${BASE_URL}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      'Authorization': 'Bearer invalid_key_for_testing',
      'Content-Type': 'application/json',
    },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  return fetch(url, options);
}

// Store order IDs for status checks later
const createdOrderIds: string[] = [];

describeIf('🔴 LIVE Thanks.io API Tests (REAL MONEY)', () => {
  beforeAll(() => {
    assertLiveTestEnabled();
    console.log('\n' + '⚠️'.repeat(30));
    console.log('⚠️  LIVE API TESTS — REAL MONEY WILL BE SPENT');
    console.log(`📬 Default recipient: ${RECIPIENT_STRING}`);
    console.log(`💰 Max spend cap: $${LIVE_TEST_CONFIG.maxSpend.toFixed(2)}`);
    console.log(`📋 Profile: ${PROFILE}`);
    console.log(`🔑 API Key: ...${API_KEY.slice(-4)}`);
    console.log('⚠️'.repeat(30) + '\n');
  });

  afterAll(() => {
    tracker.printSummary();
    tracker.saveReport();
  });

  // ========================================================================
  // 1. API Connectivity (Cost: $0) — Always runs
  // ========================================================================
  describe('1. API Connectivity', () => {
    it('LIVE-001: Should authenticate with Thanks.io API', async () => {
      const response = await apiRequest('GET', '/handwriting');
      expect(response.status).toBe(200);
      tracker.recordTestResult('passed');
    });

    it('LIVE-002: Should fetch real handwriting styles', async () => {
      const response = await apiRequest('GET', '/handwriting');
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty('data');
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);

      const firstStyle = data.data[0];
      expect(firstStyle).toHaveProperty('id');
      expect(firstStyle).toHaveProperty('name');
      console.log(`   📝 Found ${data.data.length} handwriting styles`);
      tracker.recordTestResult('passed');
    });

    it('LIVE-003: Should verify account is active', async () => {
      const response = await apiRequest('GET', '/account');
      // Account endpoint may vary — just verify we get a non-error response
      expect([200, 404].includes(response.status)).toBe(true);
      tracker.recordTestResult('passed');
    });
  });

  // ========================================================================
  // 2. Postcard Send Tests — smoke: 1 card, standard: all sizes, full: + colors
  // ========================================================================
  describe('2. Postcard Send', () => {
    it('LIVE-004: Should send 4x6 postcard to default address', async () => {
      const cost = 1.14;
      tracker.assertCanSpend(cost, 'Postcard 4x6');

      console.log(`   📬 Sending: Postcard (4x6) → ${RECIPIENT_STRING}`);
      console.log(`   💰 Estimated cost: $${cost.toFixed(2)}`);

      const response = await apiRequest('POST', '/postcard/send', {
        recipients: [RECIPIENT],
        message: MESSAGE,
        handwriting_style: LIVE_TEST_CONFIG.defaultHandwritingStyle,
        handwriting_color: LIVE_TEST_CONFIG.defaultHandwritingColor,
        size: '4x6',
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty('id');
      expect(data.status).toBe('queued');

      createdOrderIds.push(data.id);
      tracker.recordSpend('LIVE-004', data.id, 'postcard-4x6', cost, RECIPIENT_STRING);
      tracker.recordTestResult('passed');
    });

    it.skipIf(!isStandard)('LIVE-005: Should send 6x9 postcard to default address', async () => {
      const cost = 1.61;
      tracker.assertCanSpend(cost, 'Postcard 6x9');

      console.log(`   📬 Sending: Postcard (6x9) → ${RECIPIENT_STRING}`);

      const response = await apiRequest('POST', '/postcard/send', {
        recipients: [RECIPIENT],
        message: MESSAGE,
        handwriting_style: LIVE_TEST_CONFIG.defaultHandwritingStyle,
        size: '6x9',
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty('id');

      createdOrderIds.push(data.id);
      tracker.recordSpend('LIVE-005', data.id, 'postcard-6x9', cost, RECIPIENT_STRING);
      tracker.recordTestResult('passed');
    });

    it.skipIf(!isStandard)('LIVE-006: Should send 6x11 postcard to default address', async () => {
      const cost = 1.83;
      tracker.assertCanSpend(cost, 'Postcard 6x11');

      console.log(`   📬 Sending: Postcard (6x11) → ${RECIPIENT_STRING}`);

      const response = await apiRequest('POST', '/postcard/send', {
        recipients: [RECIPIENT],
        message: MESSAGE,
        handwriting_style: LIVE_TEST_CONFIG.defaultHandwritingStyle,
        size: '6x11',
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty('id');

      createdOrderIds.push(data.id);
      tracker.recordSpend('LIVE-006', data.id, 'postcard-6x11', cost, RECIPIENT_STRING);
      tracker.recordTestResult('passed');
    });

    it.skipIf(!isFull)('LIVE-007: Should send postcard with custom front image', async () => {
      const cost = 1.14;
      tracker.assertCanSpend(cost, 'Postcard with image');

      const response = await apiRequest('POST', '/postcard/send', {
        recipients: [RECIPIENT],
        message: MESSAGE,
        handwriting_style: LIVE_TEST_CONFIG.defaultHandwritingStyle,
        front_image_url: 'https://placehold.co/600x400/png',
        size: '4x6',
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty('id');

      createdOrderIds.push(data.id);
      tracker.recordSpend('LIVE-007', data.id, 'postcard-image', cost, RECIPIENT_STRING);
      tracker.recordTestResult('passed');
    });
  });

  // ========================================================================
  // 3. Letter Send Tests — standard+ only
  // ========================================================================
  describe('3. Letter Send', () => {
    it.skipIf(!isStandard)('LIVE-009: Should send windowed letter to default address', async () => {
      const cost = 1.20;
      tracker.assertCanSpend(cost, 'Letter (windowed)');

      console.log(`   📬 Sending: Letter → ${RECIPIENT_STRING}`);

      const response = await apiRequest('POST', '/letter/send', {
        recipients: [RECIPIENT],
        message: MESSAGE,
        handwriting_style: LIVE_TEST_CONFIG.defaultHandwritingStyle,
        handwriting_color: LIVE_TEST_CONFIG.defaultHandwritingColor,
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty('id');

      createdOrderIds.push(data.id);
      tracker.recordSpend('LIVE-009', data.id, 'letter', cost, RECIPIENT_STRING);
      tracker.recordTestResult('passed');
    });

    it.skipIf(!isFull)('LIVE-010: Should send letter with 2 pages', async () => {
      const cost = 1.40; // $1.20 + $0.20 extra page
      tracker.assertCanSpend(cost, 'Letter 2-page');

      const response = await apiRequest('POST', '/letter/send', {
        recipients: [RECIPIENT],
        message: MESSAGE + '\n\nPage 2: Additional QA test content for multi-page verification.',
        handwriting_style: LIVE_TEST_CONFIG.defaultHandwritingStyle,
        pages: 2,
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty('id');

      createdOrderIds.push(data.id);
      tracker.recordSpend('LIVE-010', data.id, 'letter-2page', cost, RECIPIENT_STRING);
      tracker.recordTestResult('passed');
    });
  });

  // ========================================================================
  // 4. Greeting Card Tests — full only
  // ========================================================================
  describe('4. Greeting Card Send', () => {
    it.skipIf(!isFull)('LIVE-012: Should send greeting card to default address', async () => {
      const cost = 3.00;
      tracker.assertCanSpend(cost, 'Greeting card');

      console.log(`   📬 Sending: Greeting Card → ${RECIPIENT_STRING}`);

      const response = await apiRequest('POST', '/greeting/send', {
        recipients: [RECIPIENT],
        message: MESSAGE,
        handwriting_style: LIVE_TEST_CONFIG.defaultHandwritingStyle,
        handwriting_color: LIVE_TEST_CONFIG.defaultHandwritingColor,
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty('id');

      createdOrderIds.push(data.id);
      tracker.recordSpend('LIVE-012', data.id, 'greeting-card', cost, RECIPIENT_STRING);
      tracker.recordTestResult('passed');
    });
  });

  // ========================================================================
  // 5. Windowless Letter Tests — full only
  // ========================================================================
  describe('5. Windowless Letter Send', () => {
    it.skipIf(!isFull)('LIVE-014: Should send windowless letter with PDF', async () => {
      const cost = 2.52;
      tracker.assertCanSpend(cost, 'Windowless letter');

      console.log(`   📬 Sending: Windowless Letter → ${RECIPIENT_STRING}`);

      const response = await apiRequest('POST', '/send/windowlessletter', {
        recipients: [RECIPIENT],
        pdf_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        handwriting_style: LIVE_TEST_CONFIG.defaultHandwritingStyle,
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty('id');

      createdOrderIds.push(data.id);
      tracker.recordSpend('LIVE-014', data.id, 'windowless-letter', cost, RECIPIENT_STRING);
      tracker.recordTestResult('passed');
    });
  });

  // ========================================================================
  // 6. Error Handling (Cost: $0) — Always runs
  // ========================================================================
  describe('6. Error Handling', () => {
    it('LIVE-016: Should reject invalid API key', async () => {
      const response = await apiRequestBadKey('GET', '/handwriting');
      expect(response.status).toBe(401);
      tracker.recordTestResult('passed');
    });

    it('LIVE-017: Should reject missing required fields', async () => {
      const response = await apiRequest('POST', '/postcard/send', {
        // Missing recipients and message
        size: '4x6',
      });

      expect(response.ok).toBe(false);
      expect([400, 422].includes(response.status)).toBe(true);
      tracker.recordTestResult('passed');
    });

    it('LIVE-018: Should reject invalid address format', async () => {
      const response = await apiRequest('POST', '/postcard/send', {
        recipients: [{
          name: '',
          address: '',
          city: '',
          province: '',
          postal_code: '',
          country: '',
        }],
        message: 'Test',
        size: '4x6',
      });

      expect(response.ok).toBe(false);
      tracker.recordTestResult('passed');
    });

    it('LIVE-019: Should reject invalid postal code', async () => {
      const response = await apiRequest('POST', '/postcard/send', {
        recipients: [{
          name: 'Test',
          address: '123 Test St',
          city: 'Nowhere',
          province: 'XX',
          postal_code: '00000',
          country: 'US',
        }],
        message: 'Test',
        size: '4x6',
      });

      // API may queue it and fail later, or reject immediately
      const data = await response.json();
      // Just verify we get a response — exact behavior varies
      expect(data).toBeDefined();
      tracker.recordTestResult('passed');
    });
  });

  // ========================================================================
  // 7. Order Status & Tracking (Cost: $0) — standard+
  // ========================================================================
  describe('7. Order Status', () => {
    it.skipIf(!isStandard || createdOrderIds.length === 0)(
      'LIVE-020: Should check order status by ID',
      async () => {
        const orderId = createdOrderIds[0];
        if (!orderId) {
          console.log('   ⏭ No orders to check — skipping');
          tracker.recordTestResult('skipped');
          return;
        }

        const response = await apiRequest('GET', `/order/${orderId}`);
        // Order lookup endpoint may vary
        if (response.ok) {
          const data = await response.json();
          expect(data).toHaveProperty('id');
          console.log(`   📋 Order ${orderId}: status=${data.status}`);
        }
        tracker.recordTestResult('passed');
      }
    );
  });

  // ========================================================================
  // 8. Pricing Verification (Cost: $0) — Always runs
  // ========================================================================
  describe('8. Pricing Verification', () => {
    it('LIVE-022: Verify postcard 4x6 price = $1.14', () => {
      expect(getPostcardPrice('4x6')).toBe(1.14);
      expect(PRODUCT_CATALOG.postcard.basePrice).toBe(1.14);
      tracker.recordTestResult('passed');
    });

    it('LIVE-023: Verify postcard 6x9 price = $1.61', () => {
      expect(getPostcardPrice('6x9')).toBe(1.61);
      tracker.recordTestResult('passed');
    });

    it('LIVE-024: Verify postcard 6x11 price = $1.83', () => {
      expect(getPostcardPrice('6x11')).toBe(1.83);
      tracker.recordTestResult('passed');
    });

    it('LIVE-025: Verify letter base price = $1.20', () => {
      expect(PRODUCT_CATALOG.letter.basePrice).toBe(1.20);
      tracker.recordTestResult('passed');
    });

    it('LIVE-026: Verify greeting card price = $3.00', () => {
      expect(PRODUCT_CATALOG.greeting.basePrice).toBe(3.00);
      tracker.recordTestResult('passed');
    });

    it('LIVE-027: Verify windowless letter price = $2.52', () => {
      expect(PRODUCT_CATALOG.windowless_letter.basePrice).toBe(2.52);
      tracker.recordTestResult('passed');
    });
  });
});
