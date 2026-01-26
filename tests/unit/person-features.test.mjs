/**
 * Unit tests for Person Features Computation (GDP-011)
 *
 * Tests the person-features library functions for computing behavioral features
 */

import { PrismaClient } from '@prisma/client';
import {
  computePersonFeatures,
  storePersonFeatures,
  computeAndStorePersonFeatures,
  getPersonFeatures,
  shouldRecomputeFeatures,
  getOrComputePersonFeatures,
  getPersonsByFeatures,
  computePersonFeaturesBatch,
  getFeatureStatistics,
} from '../../src/lib/person-features.js';

const prisma = new PrismaClient();

describe('Person Features Computation (GDP-011)', () => {
  let testPerson;
  let testPerson2;

  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.personFeatures.deleteMany({
      where: {
        person: {
          email: {
            in: [
              'test-features@example.com',
              'test-features-2@example.com',
              'test-features-3@example.com',
            ],
          },
        },
      },
    });

    await prisma.unifiedEvent.deleteMany({
      where: {
        person: {
          email: {
            in: [
              'test-features@example.com',
              'test-features-2@example.com',
              'test-features-3@example.com',
            ],
          },
        },
      },
    });

    await prisma.person.deleteMany({
      where: {
        email: {
          in: [
            'test-features@example.com',
            'test-features-2@example.com',
            'test-features-3@example.com',
          ],
        },
      },
    });
  });

  beforeEach(async () => {
    // Create test persons
    testPerson = await prisma.person.create({
      data: {
        email: 'test-features@example.com',
        firstName: 'Test',
        lastName: 'User',
        firstSeenAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        lastSeenAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
    });

    testPerson2 = await prisma.person.create({
      data: {
        email: 'test-features-2@example.com',
        firstName: 'Test2',
        lastName: 'User2',
        firstSeenAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        lastSeenAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      },
    });

    // Create test events for testPerson
    const now = Date.now();
    const events = [
      // Day 1 (5 days ago)
      {
        personId: testPerson.id,
        eventName: 'landing_view',
        source: 'web',
        timestamp: new Date(now - 5 * 24 * 60 * 60 * 1000),
      },
      {
        personId: testPerson.id,
        eventName: 'pricing_view',
        source: 'web',
        timestamp: new Date(now - 5 * 24 * 60 * 60 * 1000),
      },
      // Day 2 (4 days ago)
      {
        personId: testPerson.id,
        eventName: 'letter_created',
        source: 'app',
        timestamp: new Date(now - 4 * 24 * 60 * 60 * 1000),
      },
      {
        personId: testPerson.id,
        eventName: 'recipient_added',
        source: 'app',
        timestamp: new Date(now - 4 * 24 * 60 * 60 * 1000),
      },
      // Day 3 (3 days ago)
      {
        personId: testPerson.id,
        eventName: 'letter_sent',
        source: 'app',
        timestamp: new Date(now - 3 * 24 * 60 * 60 * 1000),
      },
      {
        personId: testPerson.id,
        eventName: 'email_opened',
        source: 'email',
        timestamp: new Date(now - 3 * 24 * 60 * 60 * 1000),
      },
      // Day 4 (2 days ago)
      {
        personId: testPerson.id,
        eventName: 'email_clicked',
        source: 'email',
        timestamp: new Date(now - 2 * 24 * 60 * 60 * 1000),
      },
      {
        personId: testPerson.id,
        eventName: 'template_created',
        source: 'app',
        timestamp: new Date(now - 2 * 24 * 60 * 60 * 1000),
      },
      // Day 5 (1 day ago)
      {
        personId: testPerson.id,
        eventName: 'letter_sent',
        source: 'app',
        timestamp: new Date(now - 1 * 24 * 60 * 60 * 1000),
      },
      {
        personId: testPerson.id,
        eventName: 'subscription_started',
        source: 'stripe',
        timestamp: new Date(now - 1 * 24 * 60 * 60 * 1000),
      },
    ];

    await prisma.unifiedEvent.createMany({ data: events });

    // Create events for testPerson2
    await prisma.unifiedEvent.createMany({
      data: [
        {
          personId: testPerson2.id,
          eventName: 'landing_view',
          source: 'web',
          timestamp: new Date(now - 20 * 24 * 60 * 60 * 1000),
        },
        {
          personId: testPerson2.id,
          eventName: 'letter_created',
          source: 'app',
          timestamp: new Date(now - 15 * 24 * 60 * 60 * 1000),
        },
      ],
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.personFeatures.deleteMany({
      where: {
        person: {
          email: {
            in: [
              'test-features@example.com',
              'test-features-2@example.com',
              'test-features-3@example.com',
            ],
          },
        },
      },
    });

    await prisma.unifiedEvent.deleteMany({
      where: {
        person: {
          email: {
            in: [
              'test-features@example.com',
              'test-features-2@example.com',
              'test-features-3@example.com',
            ],
          },
        },
      },
    });

    await prisma.person.deleteMany({
      where: {
        email: {
          in: [
            'test-features@example.com',
            'test-features-2@example.com',
            'test-features-3@example.com',
          ],
        },
      },
    });

    await prisma.$disconnect();
  });

  describe('computePersonFeatures', () => {
    it('should compute behavioral features correctly', async () => {
      const features = await computePersonFeatures(testPerson.id);

      // Check counts
      expect(features.activeDays).toBe(5); // Events across 5 different days
      expect(features.coreActions).toBe(3); // 2 letter_sent + 1 subscription_started
      expect(features.pricingViews).toBe(1);
      expect(features.emailOpens).toBe(1);
      expect(features.emailClicks).toBe(1);

      // Product-specific
      expect(features.lettersCreated).toBe(1);
      expect(features.lettersSent).toBe(2);
      expect(features.templatesCreated).toBe(1);
      expect(features.recipientsAdded).toBe(1);

      // Time-based
      expect(features.daysSinceSignup).toBeGreaterThanOrEqual(29);
      expect(features.daysSinceSignup).toBeLessThanOrEqual(31);
      expect(features.daysSinceLastActive).toBeGreaterThanOrEqual(1);
      expect(features.daysSinceLastActive).toBeLessThanOrEqual(3);
    });

    it('should handle person with no events', async () => {
      const emptyPerson = await prisma.person.create({
        data: {
          email: 'test-features-3@example.com',
          firstName: 'Empty',
          lastName: 'User',
        },
      });

      const features = await computePersonFeatures(emptyPerson.id);

      expect(features.activeDays).toBe(0);
      expect(features.coreActions).toBe(0);
      expect(features.pricingViews).toBe(0);
      expect(features.emailOpens).toBe(0);
      expect(features.lettersCreated).toBe(0);
    });

    it('should respect lookback window', async () => {
      // Compute with 1 day lookback (should only see events from yesterday)
      const features = await computePersonFeatures(testPerson.id, 1);

      expect(features.activeDays).toBe(1); // Only yesterday
      expect(features.lettersSent).toBe(1); // Only 1 letter from yesterday
    });

    it('should throw error for non-existent person', async () => {
      await expect(
        computePersonFeatures('non-existent-id')
      ).rejects.toThrow('Person not found');
    });
  });

  describe('storePersonFeatures', () => {
    it('should store features in database', async () => {
      const features = await computePersonFeatures(testPerson.id);
      const stored = await storePersonFeatures(testPerson.id, features);

      expect(stored.personId).toBe(testPerson.id);
      expect(stored.activeDays).toBe(features.activeDays);
      expect(stored.coreActions).toBe(features.coreActions);
      expect(stored.computedAt).toBeDefined();
    });

    it('should update existing features on upsert', async () => {
      const features1 = await computePersonFeatures(testPerson.id);
      const stored1 = await storePersonFeatures(testPerson.id, features1);

      // Wait a bit and store again
      await new Promise((resolve) => setTimeout(resolve, 100));

      const features2 = {
        ...features1,
        coreActions: features1.coreActions + 5,
      };
      const stored2 = await storePersonFeatures(testPerson.id, features2);

      expect(stored2.id).toBe(stored1.id); // Same record
      expect(stored2.coreActions).toBe(features2.coreActions);
      expect(stored2.computedAt.getTime()).toBeGreaterThan(
        stored1.computedAt.getTime()
      );
    });
  });

  describe('computeAndStorePersonFeatures', () => {
    it('should compute and store features in one call', async () => {
      const stored = await computeAndStorePersonFeatures(testPerson.id);

      expect(stored.personId).toBe(testPerson.id);
      expect(stored.activeDays).toBeGreaterThan(0);

      // Verify it was stored in database
      const retrieved = await prisma.personFeatures.findUnique({
        where: { personId: testPerson.id },
      });

      expect(retrieved).toBeDefined();
      expect(retrieved?.activeDays).toBe(stored.activeDays);
    });
  });

  describe('getPersonFeatures', () => {
    it('should retrieve stored features', async () => {
      await computeAndStorePersonFeatures(testPerson.id);

      const retrieved = await getPersonFeatures(testPerson.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.personId).toBe(testPerson.id);
      expect(retrieved?.activeDays).toBeGreaterThan(0);
    });

    it('should return null for person without features', async () => {
      const retrieved = await getPersonFeatures(testPerson2.id);

      expect(retrieved).toBeNull();
    });
  });

  describe('shouldRecomputeFeatures', () => {
    it('should return true if features not computed yet', async () => {
      const shouldRecompute = await shouldRecomputeFeatures(testPerson2.id);

      expect(shouldRecompute).toBe(true);
    });

    it('should return true if features are old', async () => {
      // Create features with old computedAt date
      await prisma.personFeatures.create({
        data: {
          personId: testPerson.id,
          activeDays: 5,
          coreActions: 2,
          pricingViews: 1,
          emailOpens: 1,
          emailClicks: 1,
          lettersCreated: 1,
          lettersSent: 2,
          templatesCreated: 1,
          recipientsAdded: 1,
          daysSinceSignup: 30,
          daysSinceLastActive: 2,
          computedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days old
        },
      });

      const shouldRecompute = await shouldRecomputeFeatures(
        testPerson.id,
        1 // Max age 1 day
      );

      expect(shouldRecompute).toBe(true);
    });

    it('should return false if features are fresh', async () => {
      await computeAndStorePersonFeatures(testPerson.id);

      const shouldRecompute = await shouldRecomputeFeatures(testPerson.id, 1);

      expect(shouldRecompute).toBe(false);
    });
  });

  describe('getOrComputePersonFeatures', () => {
    it('should compute features if not exist', async () => {
      const features = await getOrComputePersonFeatures(testPerson2.id);

      expect(features).toBeDefined();
      expect(features?.personId).toBe(testPerson2.id);
    });

    it('should return cached features if fresh', async () => {
      await computeAndStorePersonFeatures(testPerson.id);

      const features = await getOrComputePersonFeatures(testPerson.id, 1);

      expect(features).toBeDefined();
      expect(features?.personId).toBe(testPerson.id);
    });

    it('should recompute if features are stale', async () => {
      // Create old features
      await prisma.personFeatures.create({
        data: {
          personId: testPerson.id,
          activeDays: 1, // Wrong value
          coreActions: 0,
          pricingViews: 0,
          emailOpens: 0,
          emailClicks: 0,
          lettersCreated: 0,
          lettersSent: 0,
          templatesCreated: 0,
          recipientsAdded: 0,
          daysSinceSignup: 20,
          daysSinceLastActive: 5,
          computedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      });

      const features = await getOrComputePersonFeatures(testPerson.id, 1);

      expect(features?.activeDays).toBeGreaterThan(1); // Should be recomputed
    });
  });

  describe('getPersonsByFeatures', () => {
    beforeEach(async () => {
      // Store features for both test persons
      await computeAndStorePersonFeatures(testPerson.id);
      await computeAndStorePersonFeatures(testPerson2.id);
    });

    it('should find persons with minimum active days', async () => {
      const personIds = await getPersonsByFeatures({
        activeDaysMin: 3,
      });

      expect(personIds).toContain(testPerson.id); // Has 5 active days
      expect(personIds).not.toContain(testPerson2.id); // Has 2 active days
    });

    it('should find persons with minimum core actions', async () => {
      const personIds = await getPersonsByFeatures({
        coreActionsMin: 2,
      });

      expect(personIds).toContain(testPerson.id); // Has 3 core actions
    });

    it('should find persons with maximum days since last active', async () => {
      const personIds = await getPersonsByFeatures({
        daysSinceLastActiveMax: 5,
      });

      expect(personIds).toContain(testPerson.id); // 2 days since last active
      expect(personIds).not.toContain(testPerson2.id); // 10 days since last active
    });

    it('should support multiple criteria', async () => {
      const personIds = await getPersonsByFeatures({
        activeDaysMin: 3,
        lettersSentMin: 1,
      });

      expect(personIds).toContain(testPerson.id);
    });
  });

  describe('computePersonFeaturesBatch', () => {
    it('should compute features for multiple persons', async () => {
      const results = await computePersonFeaturesBatch([
        testPerson.id,
        testPerson2.id,
      ]);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);

      // Verify features were stored
      const features1 = await getPersonFeatures(testPerson.id);
      const features2 = await getPersonFeatures(testPerson2.id);

      expect(features1).toBeDefined();
      expect(features2).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      const results = await computePersonFeaturesBatch([
        testPerson.id,
        'non-existent-id',
        testPerson2.id,
      ]);

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toBeDefined();
      expect(results[2].success).toBe(true);
    });

    it('should respect batch size', async () => {
      // This test just verifies the function runs with batch size
      const results = await computePersonFeaturesBatch(
        [testPerson.id, testPerson2.id],
        1 // Process one at a time
      );

      expect(results).toHaveLength(2);
    });
  });

  describe('getFeatureStatistics', () => {
    beforeEach(async () => {
      // Store features for test persons
      await computeAndStorePersonFeatures(testPerson.id);
      await computeAndStorePersonFeatures(testPerson2.id);
    });

    it('should compute statistics across all persons', async () => {
      const stats = await getFeatureStatistics();

      expect(stats).toBeDefined();
      expect(stats?.total).toBeGreaterThanOrEqual(2);
      expect(stats?.activeDays.avg).toBeGreaterThan(0);
      expect(stats?.activeDays.median).toBeGreaterThan(0);
      expect(stats?.activeDays.max).toBeGreaterThan(0);
    });

    it('should return null if no features exist', async () => {
      // Delete all features
      await prisma.personFeatures.deleteMany();

      const stats = await getFeatureStatistics();

      expect(stats).toBeNull();
    });
  });
});
