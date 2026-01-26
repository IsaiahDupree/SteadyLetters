/**
 * Unit tests for Meta Conversions API (CAPI)
 */

import { describe, test, expect } from '@jest/globals';
import { hashUserData, createMetaCAPIEvent } from '../../src/lib/meta-capi.ts';

describe('Meta CAPI', () => {
  describe('hashUserData', () => {
    test('should hash email addresses', () => {
      const hash = hashUserData('test@example.com');

      expect(hash).toBeTruthy();
      expect(hash).toHaveLength(64); // SHA256 hex length
      expect(hash).not.toContain('@'); // Should be hashed
    });

    test('should normalize email before hashing', () => {
      const hash1 = hashUserData('Test@Example.com');
      const hash2 = hashUserData('test@example.com');
      const hash3 = hashUserData(' test@example.com ');

      expect(hash1).toBe(hash2);
      expect(hash2).toBe(hash3);
    });

    test('should handle empty strings', () => {
      const hash = hashUserData('');

      expect(hash).toBe('');
    });

    test('should produce consistent hashes', () => {
      const email = 'consistent@example.com';
      const hash1 = hashUserData(email);
      const hash2 = hashUserData(email);

      expect(hash1).toBe(hash2);
    });

    test('should produce different hashes for different emails', () => {
      const hash1 = hashUserData('user1@example.com');
      const hash2 = hashUserData('user2@example.com');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('createMetaCAPIEvent', () => {
    const eventId = 'test-event-123';
    const userData = {
      email: 'test@example.com',
      externalId: 'user-123',
    };

    test('should create signup_start event', () => {
      const event = createMetaCAPIEvent('signup_start', {}, eventId, userData);

      expect(event).toBeTruthy();
      expect(event.eventName).toBe('CompleteRegistration');
      expect(event.eventId).toBe(eventId);
      expect(event.customData?.status).toBe('started');
      expect(event.userData).toBe(userData);
      expect(event.actionSource).toBe('website');
    });

    test('should create letter_sent event with purchase data', () => {
      const properties = {
        letter_id: 'letter-123',
        cost: 5.99,
        recipient_count: 2,
      };

      const event = createMetaCAPIEvent('letter_sent', properties, eventId, userData);

      expect(event).toBeTruthy();
      expect(event.eventName).toBe('Purchase');
      expect(event.customData?.value).toBe(5.99);
      expect(event.customData?.currency).toBe('USD');
      expect(event.customData?.contentType).toBe('letter');
      expect(event.customData?.numItems).toBe(2);
    });

    test('should create subscription_started event', () => {
      const properties = {
        value: 29,
        currency: 'USD',
        plan: 'pro',
      };

      const event = createMetaCAPIEvent('subscription_started', properties, eventId, userData);

      expect(event).toBeTruthy();
      expect(event.eventName).toBe('Subscribe');
      expect(event.customData?.value).toBe(29);
      expect(event.customData?.currency).toBe('USD');
      expect(event.customData?.predictedLtv).toBe(348); // 29 * 12
    });

    test('should create checkout_started event', () => {
      const properties = {
        value: 49,
        currency: 'USD',
      };

      const event = createMetaCAPIEvent('checkout_started', properties, eventId, userData);

      expect(event).toBeTruthy();
      expect(event.eventName).toBe('InitiateCheckout');
      expect(event.customData?.value).toBe(49);
      expect(event.customData?.currency).toBe('USD');
    });

    test('should return null for unmapped events', () => {
      const event = createMetaCAPIEvent('unknown_event', {}, eventId, userData);

      expect(event).toBeNull();
    });

    test('should include event time as unix timestamp', () => {
      const event = createMetaCAPIEvent('signup_start', {}, eventId, userData);

      expect(event?.eventTime).toBeTruthy();
      expect(event?.eventTime).toBeLessThanOrEqual(Math.floor(Date.now() / 1000));
      expect(event?.eventTime).toBeGreaterThan(1700000000); // After 2023
    });

    test('should handle missing user data', () => {
      const event = createMetaCAPIEvent('signup_start', {}, eventId);

      expect(event).toBeTruthy();
      expect(event.userData).toBeUndefined();
    });

    test('should include event source URL if provided', () => {
      const properties = {
        page_url: 'https://steadyletters.com/pricing',
      };

      const event = createMetaCAPIEvent('pricing_view', properties, eventId, userData);

      expect(event?.eventSourceUrl).toBe('https://steadyletters.com/pricing');
    });
  });

  describe('Event Mapping Coverage', () => {
    const eventId = 'test-123';
    const userData = { email: 'test@example.com' };

    const testCases = [
      { event: 'signup_start', expectedName: 'CompleteRegistration' },
      { event: 'login_success', expectedName: 'CompleteRegistration' },
      { event: 'activation_complete', expectedName: 'Lead' },
      { event: 'letter_created', expectedName: 'ViewContent' },
      { event: 'letter_sent', expectedName: 'Purchase' },
      { event: 'checkout_started', expectedName: 'InitiateCheckout' },
      { event: 'purchase_completed', expectedName: 'Purchase' },
      { event: 'subscription_started', expectedName: 'Subscribe' },
      { event: 'pricing_view', expectedName: 'ViewContent' },
      { event: 'cta_click', expectedName: 'Contact' },
      { event: 'recipient_added', expectedName: 'AddToCart' },
    ];

    testCases.forEach(({ event, expectedName }) => {
      test(`should map ${event} to ${expectedName}`, () => {
        const capiEvent = createMetaCAPIEvent(event, {}, eventId, userData);

        expect(capiEvent).toBeTruthy();
        expect(capiEvent?.eventName).toBe(expectedName);
      });
    });
  });
});
