/**
 * Unit tests for Meta Pixel integration
 */

import { describe, test, expect } from '@jest/globals';

describe('Meta Pixel', () => {
  describe('generateEventId', () => {
    test('should generate unique event IDs', async () => {
      const { generateEventId } = await import('../../src/lib/meta-pixel.ts');

      const id1 = generateEventId();
      const id2 = generateEventId();

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^\d+_[a-z0-9]+$/);
    });
  });

  describe('mapToMetaEvent', () => {
    test('should map signup_start to CompleteRegistration', async () => {
      const { mapToMetaEvent, MetaStandardEvent } = await import('../../src/lib/meta-pixel.ts');

      const result = mapToMetaEvent('signup_start', { method: 'email' });

      expect(result).toBeTruthy();
      expect(result.event).toBe(MetaStandardEvent.CompleteRegistration);
      expect(result.params.status).toBe('started');
      expect(result.params.eventID).toBeTruthy();
    });

    test('should map letter_sent to Purchase', async () => {
      const { mapToMetaEvent, MetaStandardEvent } = await import('../../src/lib/meta-pixel.ts');

      const result = mapToMetaEvent('letter_sent', {
        letter_id: 'letter-123',
        cost: 5.99,
        recipient_count: 2,
      });

      expect(result).toBeTruthy();
      expect(result.event).toBe(MetaStandardEvent.Purchase);
      expect(result.params.value).toBe(5.99);
      expect(result.params.currency).toBe('USD');
      expect(result.params.content_type).toBe('letter');
    });

    test('should map subscription_started to Subscribe', async () => {
      const { mapToMetaEvent, MetaStandardEvent } = await import('../../src/lib/meta-pixel.ts');

      const result = mapToMetaEvent('subscription_started', {
        value: 29,
        currency: 'USD',
        plan: 'pro',
      });

      expect(result).toBeTruthy();
      expect(result.event).toBe(MetaStandardEvent.Subscribe);
      expect(result.params.value).toBe(29);
      expect(result.params.predicted_ltv).toBe(348); // 29 * 12
    });

    test('should return null for unmapped events', async () => {
      const { mapToMetaEvent } = await import('../../src/lib/meta-pixel.ts');

      const result = mapToMetaEvent('unknown_event', {});

      expect(result).toBeNull();
    });
  });

  describe('Event Mapping Coverage', () => {
    const testCases = [
      { event: 'signup_start', expectedEvent: 'CompleteRegistration' },
      { event: 'login_success', expectedEvent: 'CompleteRegistration' },
      { event: 'activation_complete', expectedEvent: 'Lead' },
      { event: 'letter_created', expectedEvent: 'ViewContent' },
      { event: 'letter_sent', expectedEvent: 'Purchase' },
      { event: 'checkout_started', expectedEvent: 'InitiateCheckout' },
      { event: 'purchase_completed', expectedEvent: 'Purchase' },
      { event: 'subscription_started', expectedEvent: 'Subscribe' },
      { event: 'pricing_view', expectedEvent: 'ViewContent' },
      { event: 'cta_click', expectedEvent: 'Contact' },
      { event: 'recipient_added', expectedEvent: 'AddToCart' },
    ];

    testCases.forEach(({ event, expectedEvent }) => {
      test(`should map ${event} to ${expectedEvent}`, async () => {
        const { mapToMetaEvent } = await import('../../src/lib/meta-pixel.ts');

        const result = mapToMetaEvent(event, {});

        expect(result).toBeTruthy();
        expect(result.event).toBe(expectedEvent);
        expect(result.params.eventID).toBeTruthy();
      });
    });
  });
});
