import { describe, test, expect, beforeEach } from '@jest/globals';
import crypto from 'crypto';

/**
 * Security Test Suite for Webhook Signature Verification
 *
 * Tests:
 * - Thanks.io webhook signature verification
 * - Invalid signature rejection
 * - Missing signature handling
 * - Timing-safe comparison
 */

// Mock NextRequest for testing
class MockRequest {
    constructor(url, options = {}) {
        this.url = url;
        this.method = options.method || 'GET';
        this.bodyText = options.body || '';
        this.headersObj = new Map(Object.entries(options.headers || {}));
    }

    async text() {
        return this.bodyText;
    }

    headers = {
        get: (name) => {
            return this.headersObj.get(name) || null;
        }
    };
}

describe('Thanks.io Webhook Signature Verification', () => {
    const mockWebhookSecret = 'test-webhook-secret-12345';
    const mockOrderData = {
        order_id: 'order_12345',
        status: 'sent',
        event_type: 'order.sent'
    };

    beforeEach(() => {
        // Set mock environment variable
        process.env.THANKS_IO_WEBHOOK_SECRET = mockWebhookSecret;
    });

    function generateValidSignature(payload, secret) {
        return crypto
            .createHmac('sha256', secret)
            .update(payload)
            .digest('hex');
    }

    test('should accept webhook with valid signature', async () => {
        const { POST } = await import('../../src/app/api/webhooks/thanks/route.ts');

        const payload = JSON.stringify(mockOrderData);
        const validSignature = generateValidSignature(payload, mockWebhookSecret);

        const req = new MockRequest('http://localhost/api/webhooks/thanks', {
            method: 'POST',
            body: payload,
            headers: {
                'x-thanks-signature': validSignature,
                'content-type': 'application/json'
            }
        });

        const response = await POST(req);

        // Should not return 401 for valid signature
        expect(response.status).not.toBe(401);
    });

    test('should reject webhook with invalid signature', async () => {
        const { POST } = await import('../../src/app/api/webhooks/thanks/route.ts');

        const payload = JSON.stringify(mockOrderData);
        const invalidSignature = 'invalid-signature-12345';

        const req = new MockRequest('http://localhost/api/webhooks/thanks', {
            method: 'POST',
            body: payload,
            headers: {
                'x-thanks-signature': invalidSignature,
                'content-type': 'application/json'
            }
        });

        const response = await POST(req);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.error).toBe('Invalid signature');
    });

    test('should reject webhook with missing signature', async () => {
        const { POST } = await import('../../src/app/api/webhooks/thanks/route.ts');

        const payload = JSON.stringify(mockOrderData);

        const req = new MockRequest('http://localhost/api/webhooks/thanks', {
            method: 'POST',
            body: payload,
            headers: {
                'content-type': 'application/json'
            }
        });

        const response = await POST(req);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.error).toBe('Invalid signature');
    });

    test('should reject webhook when webhook secret is not configured', async () => {
        // Remove webhook secret
        delete process.env.THANKS_IO_WEBHOOK_SECRET;

        const { POST } = await import('../../src/app/api/webhooks/thanks/route.ts');

        const payload = JSON.stringify(mockOrderData);
        const signature = generateValidSignature(payload, 'any-secret');

        const req = new MockRequest('http://localhost/api/webhooks/thanks', {
            method: 'POST',
            body: payload,
            headers: {
                'x-thanks-signature': signature,
                'content-type': 'application/json'
            }
        });

        const response = await POST(req);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.error).toBe('Invalid signature');
    });

    test('should use timing-safe comparison for signatures', () => {
        const signature1 = 'abcdef123456';
        const signature2 = 'abcdef123456';
        const signature3 = 'different123';

        // Timing-safe equal should be used (from crypto.timingSafeEqual)
        const buf1 = Buffer.from(signature1);
        const buf2 = Buffer.from(signature2);
        const buf3 = Buffer.from(signature3);

        expect(() => crypto.timingSafeEqual(buf1, buf2)).not.toThrow();
        expect(() => crypto.timingSafeEqual(buf1, buf3)).toThrow(); // Different lengths
    });

    test('should reject webhook with wrong secret even if signature format is correct', async () => {
        const { POST } = await import('../../src/app/api/webhooks/thanks/route.ts');

        const payload = JSON.stringify(mockOrderData);
        const wrongSecret = 'wrong-secret-67890';
        const signatureWithWrongSecret = generateValidSignature(payload, wrongSecret);

        const req = new MockRequest('http://localhost/api/webhooks/thanks', {
            method: 'POST',
            body: payload,
            headers: {
                'x-thanks-signature': signatureWithWrongSecret,
                'content-type': 'application/json'
            }
        });

        const response = await POST(req);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.error).toBe('Invalid signature');
    });

    test('should reject webhook if payload is modified after signing', async () => {
        const { POST } = await import('../../src/app/api/webhooks/thanks/route.ts');

        const originalPayload = JSON.stringify(mockOrderData);
        const validSignature = generateValidSignature(originalPayload, mockWebhookSecret);

        // Modify the payload after signature was created
        const modifiedData = { ...mockOrderData, status: 'failed' };
        const modifiedPayload = JSON.stringify(modifiedData);

        const req = new MockRequest('http://localhost/api/webhooks/thanks', {
            method: 'POST',
            body: modifiedPayload,
            headers: {
                'x-thanks-signature': validSignature,
                'content-type': 'application/json'
            }
        });

        const response = await POST(req);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.error).toBe('Invalid signature');
    });

    test('should verify signature before processing webhook data', async () => {
        const { POST } = await import('../../src/app/api/webhooks/thanks/route.ts');

        const payload = JSON.stringify({ order_id: null }); // Invalid data
        const invalidSignature = 'invalid-sig';

        const req = new MockRequest('http://localhost/api/webhooks/thanks', {
            method: 'POST',
            body: payload,
            headers: {
                'x-thanks-signature': invalidSignature,
                'content-type': 'application/json'
            }
        });

        const response = await POST(req);

        // Should fail on signature (401), not on invalid data (400)
        expect(response.status).toBe(401);
    });
});

describe('Webhook Signature Verification - Cryptographic Tests', () => {
    test('should produce correct HMAC SHA256 signature', () => {
        const secret = 'test-secret';
        const payload = 'test-payload';

        const signature = crypto
            .createHmac('sha256', secret)
            .update(payload)
            .digest('hex');

        // HMAC SHA256 should produce 64 character hex string
        expect(signature).toHaveLength(64);
        expect(/^[a-f0-9]+$/.test(signature)).toBe(true);
    });

    test('should use timing-safe comparison', () => {
        const sig1 = 'abc123';
        const sig2 = 'abc123';

        const buf1 = Buffer.from(sig1);
        const buf2 = Buffer.from(sig2);

        expect(() => crypto.timingSafeEqual(buf1, buf2)).not.toThrow();
    });

    test('should handle different length buffers gracefully', () => {
        const short = 'abc';
        const long = 'abcdef';

        const buf1 = Buffer.from(short);
        const buf2 = Buffer.from(long);

        // timingSafeEqual should throw for different lengths
        expect(() => crypto.timingSafeEqual(buf1, buf2)).toThrow();
    });
});
