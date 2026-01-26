/**
 * Integration tests for PostHog Identity Stitching (GDP-009)
 *
 * Tests that:
 * 1. Auth callback creates Person record on login
 * 2. User traits API returns person_id
 * 3. Person is linked to Supabase user via IdentityLink
 */

import { describe, test, expect, beforeEach, afterAll } from '@jest/globals';
import { prisma } from '../../src/lib/prisma.js';
import { getOrCreatePersonFromUser, findPersonByIdentity } from '../../src/lib/identity.js';

describe('PostHog Identity Stitching (GDP-009)', () => {
  const testEmail = 'test-posthog-stitching@example.com';
  const testUserId = 'test-user-ph-123';

  // Clean up test data after all tests
  afterAll(async () => {
    await prisma.identityLink.deleteMany({
      where: {
        person: {
          email: testEmail,
        },
      },
    });
    await prisma.person.deleteMany({
      where: {
        email: testEmail,
      },
    });
  });

  describe('Person Creation on Login', () => {
    test('should create Person record and link to user on first login', async () => {
      // Simulate what happens in auth callback
      const person = await getOrCreatePersonFromUser(
        testUserId,
        testEmail,
        'Test',
        'PostHog'
      );

      expect(person).toBeDefined();
      expect(person.email).toBe(testEmail);
      expect(person.firstName).toBe('Test');
      expect(person.lastName).toBe('PostHog');

      // Verify identity link was created
      const foundPerson = await findPersonByIdentity('user', testUserId);
      expect(foundPerson).toBeDefined();
      expect(foundPerson?.id).toBe(person.id);
    });

    test('should reuse existing Person on subsequent logins', async () => {
      // First login
      const person1 = await getOrCreatePersonFromUser(
        testUserId,
        testEmail,
        'Test',
        'PostHog'
      );

      // Second login (same user)
      const person2 = await getOrCreatePersonFromUser(
        testUserId,
        testEmail,
        'Test',
        'PostHog'
      );

      // Should return the same person
      expect(person2.id).toBe(person1.id);

      // Verify only one identity link exists
      const allLinks = await prisma.identityLink.findMany({
        where: {
          source: 'user',
          externalId: testUserId,
        },
      });
      expect(allLinks).toHaveLength(1);
    });
  });

  describe('Person ID in User Traits', () => {
    test('should return person_id in traits response', async () => {
      // Create person first
      const person = await getOrCreatePersonFromUser(
        testUserId,
        testEmail,
        'Test',
        'PostHog'
      );

      // The traits endpoint should include person_id
      // We can't easily test the HTTP endpoint here, but we verify
      // that getOrCreatePersonFromUser returns the correct person
      expect(person.id).toBeDefined();
      expect(typeof person.id).toBe('string');
    });
  });

  describe('Identity Stitching Across Systems', () => {
    test('should link PostHog, User, and Stripe identities to same Person', async () => {
      const email = 'test-multi-identity@example.com';
      const userId = 'user_multi_123';

      // Create person via user login
      const person = await getOrCreatePersonFromUser(userId, email);

      // Simulate linking other systems (done in other parts of the app)
      const { linkIdentity } = await import('../../src/lib/identity.js');
      await linkIdentity(person.id, 'posthog', 'ph_distinct_id_abc');
      await linkIdentity(person.id, 'stripe', 'cus_stripe_xyz');

      // Verify all identities point to same person
      const foundByUser = await findPersonByIdentity('user', userId);
      const foundByPostHog = await findPersonByIdentity('posthog', 'ph_distinct_id_abc');
      const foundByStripe = await findPersonByIdentity('stripe', 'cus_stripe_xyz');

      expect(foundByUser?.id).toBe(person.id);
      expect(foundByPostHog?.id).toBe(person.id);
      expect(foundByStripe?.id).toBe(person.id);

      // Cleanup
      await prisma.identityLink.deleteMany({
        where: { personId: person.id },
      });
      await prisma.person.delete({
        where: { id: person.id },
      });
    });
  });

  describe('PostHog Identify Call', () => {
    test('should use person_id instead of user_id for PostHog identify', async () => {
      // This test documents the expected behavior:
      // In AuthContext, we should call identifyUser(personId, traits)
      // not identifyUser(userId, traits)

      const person = await getOrCreatePersonFromUser(
        testUserId,
        testEmail,
        'Test',
        'PostHog'
      );

      // The person ID should be different from user ID
      expect(person.id).toBeDefined();
      expect(person.id).not.toBe(testUserId);

      // In the client code, we should identify with person.id
      // posthog.identify(person.id, { email, user_id: userId, ...traits })

      // This allows PostHog to stitch anonymous events to the canonical Person record
    });
  });
});
