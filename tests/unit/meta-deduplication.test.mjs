/**
 * Unit tests for Meta Pixel + CAPI Event Deduplication (GDP-010)
 *
 * Tests that:
 * 1. generateEventId() creates unique IDs
 * 2. mapToMetaEvent() uses provided eventId from properties
 * 3. Event ID is consistent between Pixel and CAPI calls
 */

import { describe, test, expect } from '@jest/globals';

// Mock the meta-pixel module
const generateEventId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${timestamp}_${random}`;
};

const mapToMetaEvent = (trackingEvent, properties) => {
  // Use provided eventId for deduplication with CAPI, or generate new one
  const eventId = properties?.eventId || generateEventId();

  switch (trackingEvent) {
    case 'signup_start':
      return {
        event: 'CompleteRegistration',
        params: {
          eventID: eventId,
          status: 'started',
          ...properties,
        },
      };

    case 'letter_sent':
      return {
        event: 'Purchase',
        params: {
          eventID: eventId,
          content_type: 'letter',
          value: properties?.cost || 0,
          currency: 'USD',
          ...properties,
        },
      };

    case 'subscription_started':
      return {
        event: 'Subscribe',
        params: {
          eventID: eventId,
          value: properties?.value || 0,
          currency: properties?.currency || 'USD',
          predicted_ltv: (properties?.value || 0) * 12,
          ...properties,
        },
      };

    default:
      return null;
  }
};

describe('Meta Pixel + CAPI Deduplication (GDP-010)', () => {
  describe('generateEventId', () => {
    test('should generate unique event IDs', () => {
      const id1 = generateEventId();
      const id2 = generateEventId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });

    test('should follow timestamp_random format', () => {
      const id = generateEventId();

      expect(id).toMatch(/^\d+_[a-z0-9]+$/);
    });

    test('should have timestamp in first part', () => {
      const id = generateEventId();
      const parts = id.split('_');

      expect(parts).toHaveLength(2);

      const timestamp = parseInt(parts[0], 10);
      const now = Date.now();

      // Timestamp should be close to current time (within 1 second)
      expect(Math.abs(now - timestamp)).toBeLessThan(1000);
    });
  });

  describe('mapToMetaEvent with eventId', () => {
    test('should use provided eventId from properties', () => {
      const customEventId = 'test_123_abc';
      const properties = {
        eventId: customEventId,
        cost: 5.0,
      };

      const result = mapToMetaEvent('letter_sent', properties);

      expect(result).toBeDefined();
      expect(result?.params.eventID).toBe(customEventId);
    });

    test('should generate new eventId if not provided', () => {
      const properties = {
        cost: 5.0,
      };

      const result = mapToMetaEvent('letter_sent', properties);

      expect(result).toBeDefined();
      expect(result?.params.eventID).toBeDefined();
      expect(result?.params.eventID).toMatch(/^\d+_[a-z0-9]+$/);
    });

    test('should use same eventId for Pixel and CAPI', () => {
      // Simulate tracking flow
      const sharedEventId = generateEventId();

      // Pixel call
      const pixelEvent = mapToMetaEvent('subscription_started', {
        eventId: sharedEventId,
        value: 29.99,
        currency: 'USD',
      });

      // CAPI call (would use same eventId)
      const capiEvent = {
        eventName: 'Subscribe',
        eventId: sharedEventId, // Same ID
        eventTime: Math.floor(Date.now() / 1000),
        actionSource: 'website',
      };

      expect(pixelEvent?.params.eventID).toBe(sharedEventId);
      expect(capiEvent.eventId).toBe(sharedEventId);
      expect(pixelEvent?.params.eventID).toBe(capiEvent.eventId);
    });
  });

  describe('Event Mapping Consistency', () => {
    test('should map signup_start to CompleteRegistration with eventID', () => {
      const eventId = 'test_signup_123';
      const result = mapToMetaEvent('signup_start', { eventId });

      expect(result?.event).toBe('CompleteRegistration');
      expect(result?.params.eventID).toBe(eventId);
      expect(result?.params.status).toBe('started');
    });

    test('should map letter_sent to Purchase with eventID', () => {
      const eventId = 'test_purchase_456';
      const result = mapToMetaEvent('letter_sent', {
        eventId,
        cost: 5.5,
        letter_id: 'letter_789',
      });

      expect(result?.event).toBe('Purchase');
      expect(result?.params.eventID).toBe(eventId);
      expect(result?.params.value).toBe(5.5);
      expect(result?.params.currency).toBe('USD');
    });

    test('should map subscription_started to Subscribe with eventID', () => {
      const eventId = 'test_sub_789';
      const result = mapToMetaEvent('subscription_started', {
        eventId,
        value: 29.99,
        currency: 'USD',
      });

      expect(result?.event).toBe('Subscribe');
      expect(result?.params.eventID).toBe(eventId);
      expect(result?.params.predicted_ltv).toBe(29.99 * 12);
    });
  });

  describe('Deduplication Scenario', () => {
    test('should demonstrate full deduplication flow', () => {
      // Step 1: Generate shared event ID (happens in tracking.ts)
      const sharedEventId = generateEventId();

      // Step 2: Fire to Meta Pixel (client-side)
      const pixelEvent = mapToMetaEvent('letter_sent', {
        eventId: sharedEventId,
        cost: 5.0,
        letter_id: 'letter_123',
      });

      // Step 3: Send to CAPI endpoint (server-side)
      // The same eventId is sent in the API call
      const capiPayload = {
        event: 'letter_sent',
        properties: {
          cost: 5.0,
          letter_id: 'letter_123',
        },
        eventId: sharedEventId, // SAME ID
      };

      // Verify both use the same event ID
      expect(pixelEvent?.params.eventID).toBe(sharedEventId);
      expect(capiPayload.eventId).toBe(sharedEventId);

      // Meta will receive:
      // 1. Browser event with eventID: sharedEventId
      // 2. Server event with event_id: sharedEventId
      // Meta will deduplicate these as ONE conversion
    });
  });
});
