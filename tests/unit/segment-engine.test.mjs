/**
 * Unit tests for Segment Engine (GDP-012)
 *
 * Tests segment evaluation, membership management, and automation triggers
 */

import { PrismaClient } from '@prisma/client';
import {
  createSegment,
  getSegment,
  getAllSegments,
  updateSegment,
  deleteSegment,
  evaluatePersonAgainstRules,
  evaluatePersonForSegment,
  addPersonToSegment,
  removePersonFromSegment,
  isPersonInSegment,
  updateSegmentMembership,
  getSegmentMembers,
  getPersonSegments,
  evaluateSegmentForAllPersons,
  evaluateAllSegmentsForPerson,
  triggerSegmentAutomation,
  getSegmentStatistics,
} from '../../src/lib/segment-engine.js';
import { computeAndStorePersonFeatures } from '../../src/lib/person-features.js';

const prisma = new PrismaClient();

describe('Segment Engine (GDP-012)', () => {
  let testPerson1;
  let testPerson2;
  let testSegment;

  beforeAll(async () => {
    // Clean up existing test data
    await prisma.segmentMember.deleteMany({
      where: {
        segment: {
          name: {
            startsWith: 'Test Segment',
          },
        },
      },
    });

    await prisma.segment.deleteMany({
      where: {
        name: {
          startsWith: 'Test Segment',
        },
      },
    });

    await prisma.personFeatures.deleteMany({
      where: {
        person: {
          email: {
            in: ['test-segment1@example.com', 'test-segment2@example.com'],
          },
        },
      },
    });

    await prisma.unifiedEvent.deleteMany({
      where: {
        person: {
          email: {
            in: ['test-segment1@example.com', 'test-segment2@example.com'],
          },
        },
      },
    });

    await prisma.person.deleteMany({
      where: {
        email: {
          in: ['test-segment1@example.com', 'test-segment2@example.com'],
        },
      },
    });
  });

  beforeEach(async () => {
    // Create test persons
    testPerson1 = await prisma.person.create({
      data: {
        email: 'test-segment1@example.com',
        firstName: 'Active',
        lastName: 'User',
        firstSeenAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        lastSeenAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
    });

    testPerson2 = await prisma.person.create({
      data: {
        email: 'test-segment2@example.com',
        firstName: 'Inactive',
        lastName: 'User',
        firstSeenAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
        lastSeenAt: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000), // 70 days ago
      },
    });

    // Create test events
    const now = Date.now();
    await prisma.unifiedEvent.createMany({
      data: [
        // Person 1: Active user
        {
          personId: testPerson1.id,
          eventName: 'letter_sent',
          source: 'app',
          timestamp: new Date(now - 3 * 24 * 60 * 60 * 1000),
        },
        {
          personId: testPerson1.id,
          eventName: 'letter_sent',
          source: 'app',
          timestamp: new Date(now - 2 * 24 * 60 * 60 * 1000),
        },
        {
          personId: testPerson1.id,
          eventName: 'subscription_started',
          source: 'stripe',
          timestamp: new Date(now - 1 * 24 * 60 * 60 * 1000),
        },
        // Person 2: Inactive user
        {
          personId: testPerson2.id,
          eventName: 'landing_view',
          source: 'web',
          timestamp: new Date(now - 80 * 24 * 60 * 60 * 1000),
        },
      ],
    });

    // Compute features
    await computeAndStorePersonFeatures(testPerson1.id, 90);
    await computeAndStorePersonFeatures(testPerson2.id, 90);
  });

  afterAll(async () => {
    // Clean up
    await prisma.segmentMember.deleteMany({
      where: {
        segment: {
          name: {
            startsWith: 'Test Segment',
          },
        },
      },
    });

    await prisma.segment.deleteMany({
      where: {
        name: {
          startsWith: 'Test Segment',
        },
      },
    });

    await prisma.personFeatures.deleteMany({
      where: {
        person: {
          email: {
            in: ['test-segment1@example.com', 'test-segment2@example.com'],
          },
        },
      },
    });

    await prisma.unifiedEvent.deleteMany({
      where: {
        person: {
          email: {
            in: ['test-segment1@example.com', 'test-segment2@example.com'],
          },
        },
      },
    });

    await prisma.person.deleteMany({
      where: {
        email: {
          in: ['test-segment1@example.com', 'test-segment2@example.com'],
        },
      },
    });

    await prisma.$disconnect();
  });

  describe('Segment CRUD Operations', () => {
    it('should create a segment', async () => {
      const segment = await createSegment({
        name: 'Test Segment - Active Users',
        description: 'Users active in last 7 days',
        rules: {
          operator: 'AND',
          conditions: [
            {
              field: 'features.daysSinceLastActive',
              operator: 'lte',
              value: 7,
            },
          ],
        },
      });

      expect(segment).toBeDefined();
      expect(segment.name).toBe('Test Segment - Active Users');
      expect(segment.enabled).toBe(true);

      testSegment = segment;
    });

    it('should get a segment by ID', async () => {
      const created = await createSegment({
        name: 'Test Segment - Get',
        description: 'Test get',
        rules: {
          operator: 'AND',
          conditions: [],
        },
      });

      const retrieved = await getSegment(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.name).toBe('Test Segment - Get');
    });

    it('should get all segments', async () => {
      await createSegment({
        name: 'Test Segment - All 1',
        description: 'Test',
        rules: { operator: 'AND', conditions: [] },
      });

      await createSegment({
        name: 'Test Segment - All 2',
        description: 'Test',
        rules: { operator: 'AND', conditions: [] },
      });

      const segments = await getAllSegments();

      expect(segments.length).toBeGreaterThanOrEqual(2);
    });

    it('should update a segment', async () => {
      const created = await createSegment({
        name: 'Test Segment - Update',
        description: 'Original description',
        rules: { operator: 'AND', conditions: [] },
      });

      const updated = await updateSegment(created.id, {
        description: 'Updated description',
        enabled: false,
      });

      expect(updated.description).toBe('Updated description');
      expect(updated.enabled).toBe(false);
    });

    it('should delete a segment', async () => {
      const created = await createSegment({
        name: 'Test Segment - Delete',
        description: 'To be deleted',
        rules: { operator: 'AND', conditions: [] },
      });

      await deleteSegment(created.id);

      const retrieved = await getSegment(created.id);

      expect(retrieved).toBeNull();
    });
  });

  describe('Segment Evaluation', () => {
    it('should evaluate AND rules correctly', async () => {
      const rules = {
        operator: 'AND',
        conditions: [
          {
            field: 'features.coreActions',
            operator: 'gte',
            value: 2,
          },
          {
            field: 'features.daysSinceLastActive',
            operator: 'lte',
            value: 5,
          },
        ],
      };

      const matches1 = await evaluatePersonAgainstRules(testPerson1.id, rules);
      const matches2 = await evaluatePersonAgainstRules(testPerson2.id, rules);

      expect(matches1).toBe(true); // Active user with core actions
      expect(matches2).toBe(false); // Inactive user
    });

    it('should evaluate OR rules correctly', async () => {
      const rules = {
        operator: 'OR',
        conditions: [
          {
            field: 'features.coreActions',
            operator: 'gte',
            value: 2,
          },
          {
            field: 'features.daysSinceSignup',
            operator: 'gte',
            value: 60,
          },
        ],
      };

      const matches1 = await evaluatePersonAgainstRules(testPerson1.id, rules);
      const matches2 = await evaluatePersonAgainstRules(testPerson2.id, rules);

      expect(matches1).toBe(true); // Has core actions
      expect(matches2).toBe(true); // Old account
    });

    it('should support eq operator', async () => {
      const rules = {
        operator: 'AND',
        conditions: [
          {
            field: 'person.firstName',
            operator: 'eq',
            value: 'Active',
          },
        ],
      };

      const matches = await evaluatePersonAgainstRules(testPerson1.id, rules);

      expect(matches).toBe(true);
    });

    it('should support gt operator', async () => {
      const rules = {
        operator: 'AND',
        conditions: [
          {
            field: 'features.coreActions',
            operator: 'gt',
            value: 1,
          },
        ],
      };

      const matches = await evaluatePersonAgainstRules(testPerson1.id, rules);

      expect(matches).toBe(true);
    });

    it('should support lt operator', async () => {
      const rules = {
        operator: 'AND',
        conditions: [
          {
            field: 'features.coreActions',
            operator: 'lt',
            value: 5,
          },
        ],
      };

      const matches = await evaluatePersonAgainstRules(testPerson1.id, rules);

      expect(matches).toBe(true);
    });

    it('should support contains operator', async () => {
      const rules = {
        operator: 'AND',
        conditions: [
          {
            field: 'person.email',
            operator: 'contains',
            value: 'segment1',
          },
        ],
      };

      const matches = await evaluatePersonAgainstRules(testPerson1.id, rules);

      expect(matches).toBe(true);
    });

    it('should handle non-existent person gracefully', async () => {
      const rules = {
        operator: 'AND',
        conditions: [],
      };

      const matches = await evaluatePersonAgainstRules('non-existent', rules);

      expect(matches).toBe(false);
    });
  });

  describe('evaluatePersonForSegment', () => {
    it('should evaluate person against segment', async () => {
      const segment = await createSegment({
        name: 'Test Segment - Evaluate',
        description: 'Active users',
        rules: {
          operator: 'AND',
          conditions: [
            {
              field: 'features.daysSinceLastActive',
              operator: 'lte',
              value: 10,
            },
          ],
        },
      });

      const matches1 = await evaluatePersonForSegment(testPerson1.id, segment.id);
      const matches2 = await evaluatePersonForSegment(testPerson2.id, segment.id);

      expect(matches1).toBe(true);
      expect(matches2).toBe(false);
    });

    it('should return false for disabled segment', async () => {
      const segment = await createSegment({
        name: 'Test Segment - Disabled',
        description: 'Disabled',
        rules: {
          operator: 'AND',
          conditions: [],
        },
        enabled: false,
      });

      const matches = await evaluatePersonForSegment(testPerson1.id, segment.id);

      expect(matches).toBe(false);
    });
  });

  describe('Segment Membership Management', () => {
    let membershipSegment;

    beforeEach(async () => {
      membershipSegment = await createSegment({
        name: 'Test Segment - Membership',
        description: 'Test membership',
        rules: {
          operator: 'AND',
          conditions: [],
        },
      });
    });

    it('should add person to segment', async () => {
      await addPersonToSegment(testPerson1.id, membershipSegment.id);

      const isMember = await isPersonInSegment(testPerson1.id, membershipSegment.id);

      expect(isMember).toBe(true);
    });

    it('should remove person from segment', async () => {
      await addPersonToSegment(testPerson1.id, membershipSegment.id);
      await removePersonFromSegment(testPerson1.id, membershipSegment.id);

      const isMember = await isPersonInSegment(testPerson1.id, membershipSegment.id);

      expect(isMember).toBe(false);
    });

    it('should re-add person after removal', async () => {
      await addPersonToSegment(testPerson1.id, membershipSegment.id);
      await removePersonFromSegment(testPerson1.id, membershipSegment.id);
      await addPersonToSegment(testPerson1.id, membershipSegment.id);

      const isMember = await isPersonInSegment(testPerson1.id, membershipSegment.id);

      expect(isMember).toBe(true);
    });

    it('should get segment members', async () => {
      await addPersonToSegment(testPerson1.id, membershipSegment.id);
      await addPersonToSegment(testPerson2.id, membershipSegment.id);

      const members = await getSegmentMembers(membershipSegment.id);

      expect(members).toHaveLength(2);
      expect(members).toContain(testPerson1.id);
      expect(members).toContain(testPerson2.id);
    });

    it('should get person segments', async () => {
      const segment1 = await createSegment({
        name: 'Test Segment - Person Segments 1',
        description: 'Test',
        rules: { operator: 'AND', conditions: [] },
      });

      const segment2 = await createSegment({
        name: 'Test Segment - Person Segments 2',
        description: 'Test',
        rules: { operator: 'AND', conditions: [] },
      });

      await addPersonToSegment(testPerson1.id, segment1.id);
      await addPersonToSegment(testPerson1.id, segment2.id);

      const segments = await getPersonSegments(testPerson1.id);

      expect(segments).toContain(segment1.id);
      expect(segments).toContain(segment2.id);
    });
  });

  describe('updateSegmentMembership', () => {
    it('should add person when they match rules', async () => {
      const segment = await createSegment({
        name: 'Test Segment - Auto Add',
        description: 'Active users',
        rules: {
          operator: 'AND',
          conditions: [
            {
              field: 'features.coreActions',
              operator: 'gte',
              value: 2,
            },
          ],
        },
      });

      const result = await updateSegmentMembership(testPerson1.id, segment.id);

      expect(result.isMember).toBe(true);
      expect(result.action).toBe('added');
    });

    it('should remove person when they no longer match', async () => {
      const segment = await createSegment({
        name: 'Test Segment - Auto Remove',
        description: 'Users with many actions',
        rules: {
          operator: 'AND',
          conditions: [
            {
              field: 'features.coreActions',
              operator: 'gte',
              value: 10, // testPerson1 doesn't have 10
            },
          ],
        },
      });

      // Manually add person
      await addPersonToSegment(testPerson1.id, segment.id);

      // Update should remove them
      const result = await updateSegmentMembership(testPerson1.id, segment.id);

      expect(result.isMember).toBe(false);
      expect(result.action).toBe('removed');
    });

    it('should return no_change when status unchanged', async () => {
      const segment = await createSegment({
        name: 'Test Segment - No Change',
        description: 'Active users',
        rules: {
          operator: 'AND',
          conditions: [
            {
              field: 'features.coreActions',
              operator: 'gte',
              value: 2,
            },
          ],
        },
      });

      // First update adds
      await updateSegmentMembership(testPerson1.id, segment.id);

      // Second update should be no change
      const result = await updateSegmentMembership(testPerson1.id, segment.id);

      expect(result.isMember).toBe(true);
      expect(result.action).toBe('no_change');
    });
  });

  describe('Batch Operations', () => {
    it('should evaluate segment for all persons', async () => {
      const segment = await createSegment({
        name: 'Test Segment - Batch',
        description: 'Active users',
        rules: {
          operator: 'AND',
          conditions: [
            {
              field: 'features.daysSinceLastActive',
              operator: 'lte',
              value: 10,
            },
          ],
        },
      });

      const result = await evaluateSegmentForAllPersons(segment.id, 5);

      expect(result.total).toBeGreaterThanOrEqual(2);
      expect(result.added).toBeGreaterThanOrEqual(1); // testPerson1 should be added
    });

    it('should evaluate all segments for person', async () => {
      const segment1 = await createSegment({
        name: 'Test Segment - All 1',
        description: 'Active users',
        rules: {
          operator: 'AND',
          conditions: [
            {
              field: 'features.coreActions',
              operator: 'gte',
              value: 1,
            },
          ],
        },
      });

      const segment2 = await createSegment({
        name: 'Test Segment - All 2',
        description: 'Recent signups',
        rules: {
          operator: 'AND',
          conditions: [
            {
              field: 'features.daysSinceSignup',
              operator: 'lte',
              value: 60,
            },
          ],
        },
      });

      const result = await evaluateAllSegmentsForPerson(testPerson1.id);

      expect(result.total).toBeGreaterThanOrEqual(2);
      expect(result.successful.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Automation Triggers', () => {
    it('should trigger email automation', async () => {
      const segment = await createSegment({
        name: 'Test Segment - Email Automation',
        description: 'Email automation',
        rules: { operator: 'AND', conditions: [] },
        actionType: 'email',
        actionConfig: {
          campaign: 'welcome',
          template: 'welcome-email',
        },
      });

      const result = await triggerSegmentAutomation(testPerson1.id, segment.id);

      expect(result.triggered).toBe(true);
      expect(result.type).toBe('email');
    });

    it('should handle missing automation config', async () => {
      const segment = await createSegment({
        name: 'Test Segment - No Automation',
        description: 'No automation',
        rules: { operator: 'AND', conditions: [] },
      });

      const result = await triggerSegmentAutomation(testPerson1.id, segment.id);

      expect(result.triggered).toBe(false);
      expect(result.error).toBe('No automation configured');
    });
  });

  describe('Statistics & Analytics', () => {
    it('should get segment statistics', async () => {
      const segment = await createSegment({
        name: 'Test Segment - Stats',
        description: 'Statistics test',
        rules: { operator: 'AND', conditions: [] },
      });

      await addPersonToSegment(testPerson1.id, segment.id);
      await addPersonToSegment(testPerson2.id, segment.id);
      await removePersonFromSegment(testPerson2.id, segment.id);

      const stats = await getSegmentStatistics(segment.id);

      expect(stats).toBeDefined();
      expect(stats?.totalMembers).toBe(1);
      expect(stats?.churnedMembers).toBe(1);
    });
  });
});
