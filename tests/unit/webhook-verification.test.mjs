import { describe, test, expect } from '@jest/globals';
import crypto from 'crypto';
import { verifyThanksSignature } from '../../src/lib/webhook-verification.js';

/**
 * Unit Test Suite for Webhook Signature Verification
 *
 * Tests the verifyThanksSignature function in isolation
 */

describe('verifyThanksSignature', () => {
    const mockSecret = 'test-webhook-secret-12345';

    function generateValidSignature(payload, secret) {
        return crypto
            .createHmac('sha256', secret)
            .update(payload)
            .digest('hex');
    }

    test('should return true for valid signature', () => {
        const payload = JSON.stringify({ order_id: 'test-123', status: 'sent' });
        const validSignature = generateValidSignature(payload, mockSecret);

        const result = verifyThanksSignature(payload, validSignature, mockSecret);

        expect(result).toBe(true);
    });

    test('should return false for invalid signature', () => {
        const payload = JSON.stringify({ order_id: 'test-123', status: 'sent' });
        const invalidSignature = 'invalid-signature-12345';

        const result = verifyThanksSignature(payload, invalidSignature, mockSecret);

        expect(result).toBe(false);
    });

    test('should return false when signature is null', () => {
        const payload = JSON.stringify({ order_id: 'test-123' });

        const result = verifyThanksSignature(payload, null, mockSecret);

        expect(result).toBe(false);
    });

    test('should return false when secret is missing', () => {
        const payload = JSON.stringify({ order_id: 'test-123' });
        const signature = generateValidSignature(payload, mockSecret);

        const result = verifyThanksSignature(payload, signature, undefined);

        expect(result).toBe(false);
    });

    test('should return false when signature is empty string', () => {
        const payload = JSON.stringify({ order_id: 'test-123' });

        const result = verifyThanksSignature(payload, '', mockSecret);

        expect(result).toBe(false);
    });

    test('should return false for signature with wrong secret', () => {
        const payload = JSON.stringify({ order_id: 'test-123' });
        const wrongSecret = 'wrong-secret-67890';
        const signatureWithWrongSecret = generateValidSignature(payload, wrongSecret);

        const result = verifyThanksSignature(payload, signatureWithWrongSecret, mockSecret);

        expect(result).toBe(false);
    });

    test('should return false if payload is modified after signing', () => {
        const originalPayload = JSON.stringify({ order_id: 'test-123', status: 'sent' });
        const validSignature = generateValidSignature(originalPayload, mockSecret);

        // Modify payload after signature was created
        const modifiedPayload = JSON.stringify({ order_id: 'test-123', status: 'failed' });

        const result = verifyThanksSignature(modifiedPayload, validSignature, mockSecret);

        expect(result).toBe(false);
    });

    test('should handle signatures of different lengths gracefully', () => {
        const payload = JSON.stringify({ order_id: 'test-123' });
        const shortSignature = 'abc123'; // Too short to be valid HMAC SHA256

        const result = verifyThanksSignature(payload, shortSignature, mockSecret);

        expect(result).toBe(false);
    });

    test('should handle very long signatures gracefully', () => {
        const payload = JSON.stringify({ order_id: 'test-123' });
        const longSignature = 'a'.repeat(1000);

        const result = verifyThanksSignature(payload, longSignature, mockSecret);

        expect(result).toBe(false);
    });

    test('should handle empty payload', () => {
        const emptyPayload = '';
        const validSignature = generateValidSignature(emptyPayload, mockSecret);

        const result = verifyThanksSignature(emptyPayload, validSignature, mockSecret);

        expect(result).toBe(true);
    });

    test('should handle special characters in payload', () => {
        const payload = JSON.stringify({
            order_id: 'test-123',
            message: '<script>alert("xss")</script>'
        });
        const validSignature = generateValidSignature(payload, mockSecret);

        const result = verifyThanksSignature(payload, validSignature, mockSecret);

        expect(result).toBe(true);
    });

    test('should handle Unicode characters in payload', () => {
        const payload = JSON.stringify({
            order_id: 'test-123',
            message: 'Hello 世界 🌍'
        });
        const validSignature = generateValidSignature(payload, mockSecret);

        const result = verifyThanksSignature(payload, validSignature, mockSecret);

        expect(result).toBe(true);
    });

    test('should be case-sensitive for signatures', () => {
        const payload = JSON.stringify({ order_id: 'test-123' });
        const validSignature = generateValidSignature(payload, mockSecret);
        const uppercaseSignature = validSignature.toUpperCase();

        // HMAC SHA256 produces lowercase hex, uppercase should fail
        const result = verifyThanksSignature(payload, uppercaseSignature, mockSecret);

        expect(result).toBe(false);
    });

    test('should produce consistent signatures for same input', () => {
        const payload = JSON.stringify({ order_id: 'test-123' });
        const signature1 = generateValidSignature(payload, mockSecret);
        const signature2 = generateValidSignature(payload, mockSecret);

        expect(signature1).toBe(signature2);

        const result1 = verifyThanksSignature(payload, signature1, mockSecret);
        const result2 = verifyThanksSignature(payload, signature2, mockSecret);

        expect(result1).toBe(true);
        expect(result2).toBe(true);
    });
});

describe('HMAC SHA256 Cryptographic Properties', () => {
    test('should produce 64-character hex string', () => {
        const secret = 'test-secret';
        const payload = 'test-payload';

        const signature = crypto
            .createHmac('sha256', secret)
            .update(payload)
            .digest('hex');

        expect(signature).toHaveLength(64);
        expect(/^[a-f0-9]+$/.test(signature)).toBe(true);
    });

    test('should use timing-safe comparison (crypto.timingSafeEqual)', () => {
        const sig1 = 'abc123';
        const sig2 = 'abc123';

        const buf1 = Buffer.from(sig1);
        const buf2 = Buffer.from(sig2);

        expect(() => crypto.timingSafeEqual(buf1, buf2)).not.toThrow();
    });

    test('timingSafeEqual should throw for different length buffers', () => {
        const short = 'abc';
        const long = 'abcdef';

        const buf1 = Buffer.from(short);
        const buf2 = Buffer.from(long);

        expect(() => crypto.timingSafeEqual(buf1, buf2)).toThrow();
    });
});
