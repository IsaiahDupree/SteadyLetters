/**
 * Unit tests for unified-events module (GDP-003)
 */

import { PrismaClient } from '@prisma/client';
import {
  trackUnifiedEvent,
  getPersonEvents,
  getPersonEventsByName,
  countPersonEvents,
  getPersonEventStats,
  trackWebEvent,
  trackAppEvent,
  trackEmailEvent,
  trackStripeEvent,
  trackMetaEvent,
} from '../../src/lib/unified-events.js';

const prisma = new PrismaClient();

describe('Unified Events Module', () => {
  let testPersonId;

  beforeEach(async () => {
    // Create a test person
    const testPerson = await prisma.person.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        firstName: 'Test',
        lastName: 'User',
      },
    });
    testPersonId = testPerson.id;
  });

  afterEach(async () => {
    // Clean up test data
    if (testPersonId) {
      await prisma.unifiedEvent.deleteMany({
        where: { personId: testPersonId },
      });
      await prisma.person.delete({
        where: { id: testPersonId },
      });
    }
  });

  describe('trackUnifiedEvent', () => {
    it('should track a basic event', async () => {
      const event = await trackUnifiedEvent({
        personId: testPersonId,
        eventName: 'test_event',
        source: 'web',
        properties: {
          test_property: 'value',
        },
      });

      expect(event).toBeDefined();
      expect(event.id).toBeDefined();
      expect(event.personId).toBe(testPersonId);
      expect(event.eventName).toBe('test_event');
      expect(event.source).toBe('web');
      expect(event.properties).toEqual({ test_property: 'value' });
    });

    it('should track event without personId', async () => {
      const event = await trackUnifiedEvent({
        eventName: 'anonymous_event',
        source: 'web',
      });

      expect(event).toBeDefined();
      expect(event.personId).toBeNull();
      expect(event.eventName).toBe('anonymous_event');
    });

    it('should include attribution data', async () => {
      const event = await trackUnifiedEvent({
        personId: testPersonId,
        eventName: 'landing_view',
        source: 'web',
        sessionId: 'session123',
        referrer: 'https://google.com',
        utmSource: 'google',
        utmMedium: 'cpc',
        utmCampaign: 'summer',
      });

      expect(event.sessionId).toBe('session123');
      expect(event.referrer).toBe('https://google.com');
      expect(event.utmSource).toBe('google');
      expect(event.utmMedium).toBe('cpc');
      expect(event.utmCampaign).toBe('summer');
    });

    it('should handle custom timestamp', async () => {
      const customDate = new Date('2024-01-01T00:00:00Z');
      const event = await trackUnifiedEvent({
        personId: testPersonId,
        eventName: 'historical_event',
        source: 'app',
        timestamp: customDate,
      });

      expect(event.timestamp).toEqual(customDate);
    });
  });

  describe('getPersonEvents', () => {
    beforeEach(async () => {
      // Create multiple test events
      await trackUnifiedEvent({
        personId: testPersonId,
        eventName: 'event_1',
        source: 'web',
      });
      await trackUnifiedEvent({
        personId: testPersonId,
        eventName: 'event_2',
        source: 'app',
      });
      await trackUnifiedEvent({
        personId: testPersonId,
        eventName: 'event_3',
        source: 'email',
      });
    });

    it('should get all events for a person', async () => {
      const events = await getPersonEvents(testPersonId);
      expect(events.length).toBeGreaterThanOrEqual(3);
      expect(events[0].personId).toBe(testPersonId);
    });

    it('should limit number of events returned', async () => {
      const events = await getPersonEvents(testPersonId, 2);
      expect(events.length).toBeLessThanOrEqual(2);
    });

    it('should return events in descending order by timestamp', async () => {
      const events = await getPersonEvents(testPersonId);
      for (let i = 1; i < events.length; i++) {
        expect(events[i - 1].timestamp.getTime()).toBeGreaterThanOrEqual(
          events[i].timestamp.getTime()
        );
      }
    });
  });

  describe('getPersonEventsByName', () => {
    beforeEach(async () => {
      await trackUnifiedEvent({
        personId: testPersonId,
        eventName: 'letter_sent',
        source: 'app',
      });
      await trackUnifiedEvent({
        personId: testPersonId,
        eventName: 'letter_sent',
        source: 'app',
      });
      await trackUnifiedEvent({
        personId: testPersonId,
        eventName: 'recipient_added',
        source: 'app',
      });
    });

    it('should filter events by name', async () => {
      const events = await getPersonEventsByName(testPersonId, 'letter_sent');
      expect(events.length).toBe(2);
      expect(events.every((e) => e.eventName === 'letter_sent')).toBe(true);
    });

    it('should return empty array for non-existent event', async () => {
      const events = await getPersonEventsByName(testPersonId, 'non_existent_event');
      expect(events.length).toBe(0);
    });
  });

  describe('countPersonEvents', () => {
    beforeEach(async () => {
      await trackUnifiedEvent({
        personId: testPersonId,
        eventName: 'letter_sent',
        source: 'app',
      });
      await trackUnifiedEvent({
        personId: testPersonId,
        eventName: 'letter_sent',
        source: 'app',
      });
      await trackUnifiedEvent({
        personId: testPersonId,
        eventName: 'recipient_added',
        source: 'app',
      });
    });

    it('should count all events for a person', async () => {
      const count = await countPersonEvents(testPersonId);
      expect(count).toBeGreaterThanOrEqual(3);
    });

    it('should count events by name', async () => {
      const count = await countPersonEvents(testPersonId, 'letter_sent');
      expect(count).toBe(2);
    });
  });

  describe('getPersonEventStats', () => {
    beforeEach(async () => {
      await trackUnifiedEvent({
        personId: testPersonId,
        eventName: 'letter_sent',
        source: 'app',
      });
      await trackUnifiedEvent({
        personId: testPersonId,
        eventName: 'letter_sent',
        source: 'app',
      });
      await trackUnifiedEvent({
        personId: testPersonId,
        eventName: 'recipient_added',
        source: 'app',
      });
    });

    it('should return event counts grouped by name', async () => {
      const stats = await getPersonEventStats(testPersonId);
      expect(stats['letter_sent']).toBe(2);
      expect(stats['recipient_added']).toBe(1);
    });
  });

  describe('Source-specific tracking functions', () => {
    it('trackWebEvent should create web event', async () => {
      const event = await trackWebEvent('landing_view', testPersonId, {
        page: '/home',
      });
      expect(event.source).toBe('web');
      expect(event.eventName).toBe('landing_view');
    });

    it('trackAppEvent should create app event', async () => {
      const event = await trackAppEvent('letter_sent', testPersonId, {
        letter_id: 'abc123',
      });
      expect(event.source).toBe('app');
      expect(event.eventName).toBe('letter_sent');
    });

    it('trackEmailEvent should create email event', async () => {
      const event = await trackEmailEvent('email_opened', testPersonId, {
        campaign: 'welcome',
      });
      expect(event.source).toBe('email');
      expect(event.eventName).toBe('email_opened');
    });

    it('trackStripeEvent should create stripe event', async () => {
      const event = await trackStripeEvent('subscription_started', testPersonId, {
        plan: 'PRO',
      });
      expect(event.source).toBe('stripe');
      expect(event.eventName).toBe('subscription_started');
    });

    it('trackMetaEvent should create meta event', async () => {
      const event = await trackMetaEvent('purchase_completed', testPersonId, {
        value: 29.99,
      });
      expect(event.source).toBe('meta');
      expect(event.eventName).toBe('purchase_completed');
    });
  });

  describe('Event properties', () => {
    it('should store complex properties as JSON', async () => {
      const event = await trackUnifiedEvent({
        personId: testPersonId,
        eventName: 'complex_event',
        source: 'app',
        properties: {
          nested: {
            key: 'value',
          },
          array: [1, 2, 3],
          boolean: true,
        },
      });

      expect(event.properties).toEqual({
        nested: {
          key: 'value',
        },
        array: [1, 2, 3],
        boolean: true,
      });
    });

    it('should handle empty properties', async () => {
      const event = await trackUnifiedEvent({
        personId: testPersonId,
        eventName: 'simple_event',
        source: 'app',
      });

      expect(event.properties).toEqual({});
    });
  });
});
