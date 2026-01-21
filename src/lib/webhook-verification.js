import crypto from 'crypto';

/**
 * Verify Thanks.io webhook signature using HMAC SHA256
 * @param {string} payload - Raw request body as string
 * @param {string | null} signature - Signature from x-thanks-signature header
 * @param {string} [secret] - Webhook secret from environment
 * @returns {boolean} true if signature is valid, false otherwise
 */
export function verifyThanksSignature(payload, signature, secret) {
    const webhookSecret = secret || process.env.THANKS_IO_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
        return false;
    }

    try {
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(payload)
            .digest('hex');

        // Use timing-safe comparison to prevent timing attacks
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );
    } catch (error) {
        // timingSafeEqual throws if buffers have different lengths
        console.error('[Webhook] Signature verification error:', error);
        return false;
    }
}
