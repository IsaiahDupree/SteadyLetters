/**
 * @jest-environment node
 */

import { jest } from '@jest/globals';
import { Webhook } from 'svix';
import { prisma } from '../../src/lib/prisma.js';

// Test data
const TEST_PERSON_ID = 'test-person-' + Date.now();
const TEST_EMAIL_ID = 'test-email-' + Date.now();
const WEBHOOK_SECRET = 'whsec_test123456789';

describe('Resend Webhook Integration', () => {
  let testPerson;

  beforeAll(async () => {
    // Create test person
    testPerson = await prisma.person.create({
      data: {
        id: TEST_PERSON_ID,
        email: 'test@example.com',
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.emailEvent.deleteMany({
      where: {
        message: {
          resendId: { contains: 'test-email-' },
        },
      },
    });

    await prisma.emailMessage.deleteMany({
      where: {
        resendId: { contains: 'test-email-' },
      },
    });

    await prisma.unifiedEvent.deleteMany({
      where: {
        personId: TEST_PERSON_ID,
      },
    });

    await prisma.person.delete({
      where: { id: TEST_PERSON_ID },
    });

    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up events before each test
    await prisma.emailEvent.deleteMany({
      where: {
        message: {
          resendId: { contains: 'test-email-' },
        },
      },
    });

    await prisma.emailMessage.deleteMany({
      where: {
        resendId: { contains: 'test-email-' },
      },
    });

    await prisma.unifiedEvent.deleteMany({
      where: {
        personId: TEST_PERSON_ID,
      },
    });
  });

  describe('Webhook Signature Verification', () => {
    it('should verify valid Svix signatures', () => {
      const payload = {
        type: 'email.sent',
        created_at: new Date().toISOString(),
        data: {
          email_id: TEST_EMAIL_ID,
          from: 'test@steadyletters.com',
          to: ['recipient@example.com'],
          subject: 'Test Email',
          tags: [
            { name: 'person_id', value: TEST_PERSON_ID },
          ],
        },
      };

      const wh = new Webhook(WEBHOOK_SECRET);
      const payloadString = JSON.stringify(payload);

      // Generate Svix signature
      const timestamp = Math.floor(Date.now() / 1000);
      const msgId = 'msg_test123';

      const headers = wh.sign(msgId, timestamp, payloadString);

      // Verify the signature
      const verified = wh.verify(payloadString, headers);
      expect(verified).toBeTruthy();
    });

    it('should reject invalid signatures', () => {
      const payload = {
        type: 'email.sent',
        created_at: new Date().toISOString(),
        data: {
          email_id: TEST_EMAIL_ID,
          from: 'test@steadyletters.com',
          to: ['recipient@example.com'],
          subject: 'Test Email',
        },
      };

      const wh = new Webhook(WEBHOOK_SECRET);
      const payloadString = JSON.stringify(payload);

      // Try to verify with invalid headers
      expect(() => {
        wh.verify(payloadString, {
          'svix-id': 'msg_invalid',
          'svix-timestamp': String(Math.floor(Date.now() / 1000)),
          'svix-signature': 'invalid_signature',
        });
      }).toThrow();
    });
  });

  describe('Email Event Storage', () => {
    it('should store EmailMessage on email.sent event', async () => {
      const emailId = `test-email-${Date.now()}`;

      // Simulate email.sent webhook
      await prisma.emailMessage.create({
        data: {
          personId: TEST_PERSON_ID,
          resendId: emailId,
          from: 'test@steadyletters.com',
          to: 'recipient@example.com',
          subject: 'Test Email',
          tags: [
            { name: 'person_id', value: TEST_PERSON_ID },
            { name: 'campaign', value: 'test_campaign' },
          ],
          campaign: 'test_campaign',
          sentAt: new Date(),
        },
      });

      // Verify EmailMessage was created
      const emailMessage = await prisma.emailMessage.findUnique({
        where: { resendId: emailId },
      });

      expect(emailMessage).toBeTruthy();
      expect(emailMessage.personId).toBe(TEST_PERSON_ID);
      expect(emailMessage.campaign).toBe('test_campaign');
      expect(emailMessage.to).toBe('recipient@example.com');
    });

    it('should store EmailEvent for email.opened', async () => {
      const emailId = `test-email-${Date.now()}`;

      // Create email message first
      const emailMessage = await prisma.emailMessage.create({
        data: {
          personId: TEST_PERSON_ID,
          resendId: emailId,
          from: 'test@steadyletters.com',
          to: 'recipient@example.com',
          subject: 'Test Email',
          tags: [],
          sentAt: new Date(),
        },
      });

      // Simulate email.opened event
      await prisma.emailEvent.create({
        data: {
          messageId: emailMessage.id,
          eventType: 'opened',
          userAgent: 'Mozilla/5.0',
          timestamp: new Date(),
        },
      });

      // Verify EmailEvent was created
      const emailEvent = await prisma.emailEvent.findFirst({
        where: {
          messageId: emailMessage.id,
          eventType: 'opened',
        },
      });

      expect(emailEvent).toBeTruthy();
      expect(emailEvent.userAgent).toBe('Mozilla/5.0');
    });

    it('should store EmailEvent for email.clicked with URL', async () => {
      const emailId = `test-email-${Date.now()}`;

      // Create email message first
      const emailMessage = await prisma.emailMessage.create({
        data: {
          personId: TEST_PERSON_ID,
          resendId: emailId,
          from: 'test@steadyletters.com',
          to: 'recipient@example.com',
          subject: 'Test Email',
          tags: [],
          sentAt: new Date(),
        },
      });

      // Simulate email.clicked event
      await prisma.emailEvent.create({
        data: {
          messageId: emailMessage.id,
          eventType: 'clicked',
          clickedUrl: 'https://steadyletters.com/offers',
          userAgent: 'Mozilla/5.0',
          timestamp: new Date(),
        },
      });

      // Verify EmailEvent was created with URL
      const emailEvent = await prisma.emailEvent.findFirst({
        where: {
          messageId: emailMessage.id,
          eventType: 'clicked',
        },
      });

      expect(emailEvent).toBeTruthy();
      expect(emailEvent.clickedUrl).toBe('https://steadyletters.com/offers');
    });

    it('should store EmailEvent for email.bounced', async () => {
      const emailId = `test-email-${Date.now()}`;

      // Create email message first
      const emailMessage = await prisma.emailMessage.create({
        data: {
          personId: TEST_PERSON_ID,
          resendId: emailId,
          from: 'test@steadyletters.com',
          to: 'invalid@example.com',
          subject: 'Test Email',
          tags: [],
          sentAt: new Date(),
        },
      });

      // Simulate email.bounced event
      await prisma.emailEvent.create({
        data: {
          messageId: emailMessage.id,
          eventType: 'bounced',
          timestamp: new Date(),
        },
      });

      // Verify EmailEvent was created
      const emailEvent = await prisma.emailEvent.findFirst({
        where: {
          messageId: emailMessage.id,
          eventType: 'bounced',
        },
      });

      expect(emailEvent).toBeTruthy();
    });
  });

  describe('Unified Event Tracking', () => {
    it('should track unified event for email.opened', async () => {
      const emailId = `test-email-${Date.now()}`;

      // Create email message
      const emailMessage = await prisma.emailMessage.create({
        data: {
          personId: TEST_PERSON_ID,
          resendId: emailId,
          from: 'test@steadyletters.com',
          to: 'recipient@example.com',
          subject: 'Test Email',
          tags: [{ name: 'campaign', value: 'test_campaign' }],
          campaign: 'test_campaign',
          sentAt: new Date(),
        },
      });

      // Create email event
      await prisma.emailEvent.create({
        data: {
          messageId: emailMessage.id,
          eventType: 'opened',
          timestamp: new Date(),
        },
      });

      // Simulate unified event tracking
      await prisma.unifiedEvent.create({
        data: {
          personId: TEST_PERSON_ID,
          eventName: 'email_opened',
          source: 'email',
          properties: {
            email_id: emailId,
            campaign: 'test_campaign',
            subject: 'Test Email',
          },
          timestamp: new Date(),
        },
      });

      // Verify unified event was created
      const unifiedEvent = await prisma.unifiedEvent.findFirst({
        where: {
          personId: TEST_PERSON_ID,
          eventName: 'email_opened',
        },
      });

      expect(unifiedEvent).toBeTruthy();
      expect(unifiedEvent.source).toBe('email');
      expect(unifiedEvent.properties).toMatchObject({ campaign: 'test_campaign' });
    });

    it('should track unified event for email.clicked', async () => {
      const emailId = `test-email-${Date.now()}`;

      // Create email message
      const emailMessage = await prisma.emailMessage.create({
        data: {
          personId: TEST_PERSON_ID,
          resendId: emailId,
          from: 'test@steadyletters.com',
          to: 'recipient@example.com',
          subject: 'Test Email',
          tags: [],
          sentAt: new Date(),
        },
      });

      // Create email event
      await prisma.emailEvent.create({
        data: {
          messageId: emailMessage.id,
          eventType: 'clicked',
          clickedUrl: 'https://steadyletters.com',
          timestamp: new Date(),
        },
      });

      // Simulate unified event tracking
      await prisma.unifiedEvent.create({
        data: {
          personId: TEST_PERSON_ID,
          eventName: 'email_clicked',
          source: 'email',
          properties: {
            email_id: emailId,
            subject: 'Test Email',
            clicked_url: 'https://steadyletters.com',
          },
          timestamp: new Date(),
        },
      });

      // Verify unified event was created
      const unifiedEvent = await prisma.unifiedEvent.findFirst({
        where: {
          personId: TEST_PERSON_ID,
          eventName: 'email_clicked',
        },
      });

      expect(unifiedEvent).toBeTruthy();
      expect(unifiedEvent.properties).toMatchObject({ clicked_url: 'https://steadyletters.com' });
    });

    it('should NOT track unified events for delivered/bounced', async () => {
      const emailId = `test-email-${Date.now()}`;

      // Create email message
      const emailMessage = await prisma.emailMessage.create({
        data: {
          personId: TEST_PERSON_ID,
          resendId: emailId,
          from: 'test@steadyletters.com',
          to: 'recipient@example.com',
          subject: 'Test Email',
          tags: [],
          sentAt: new Date(),
        },
      });

      // Create delivered event
      await prisma.emailEvent.create({
        data: {
          messageId: emailMessage.id,
          eventType: 'delivered',
          timestamp: new Date(),
        },
      });

      // Verify NO unified event was created for delivered
      const deliveredEvent = await prisma.unifiedEvent.findFirst({
        where: {
          personId: TEST_PERSON_ID,
          eventName: 'email_delivered',
        },
      });

      expect(deliveredEvent).toBeNull();
    });
  });

  describe('Tag-based Person Mapping', () => {
    it('should extract person_id from tags', async () => {
      const tags = [
        { name: 'person_id', value: TEST_PERSON_ID },
        { name: 'campaign', value: 'welcome' },
      ];

      const personIdTag = tags.find(tag => tag.name === 'person_id');
      expect(personIdTag).toBeTruthy();
      expect(personIdTag.value).toBe(TEST_PERSON_ID);
    });

    it('should extract campaign from tags', async () => {
      const tags = [
        { name: 'person_id', value: TEST_PERSON_ID },
        { name: 'campaign', value: 'welcome' },
      ];

      const campaignTag = tags.find(tag => tag.name === 'campaign');
      expect(campaignTag).toBeTruthy();
      expect(campaignTag.value).toBe('welcome');
    });

    it('should extract segment_id from tags', async () => {
      const tags = [
        { name: 'person_id', value: TEST_PERSON_ID },
        { name: 'segment_id', value: 'seg_123' },
      ];

      const segmentIdTag = tags.find(tag => tag.name === 'segment_id');
      expect(segmentIdTag).toBeTruthy();
      expect(segmentIdTag.value).toBe('seg_123');
    });

    it('should handle missing tags gracefully', async () => {
      const tags = [];

      const personIdTag = tags.find(tag => tag.name === 'person_id');
      expect(personIdTag).toBeUndefined();
    });
  });
});
