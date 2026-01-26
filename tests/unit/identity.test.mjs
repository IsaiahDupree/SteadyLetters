/**
 * Unit tests for identity resolution functions
 *
 * Tests Person creation, IdentityLink management, and identity resolution logic
 */

import { describe, test, expect, afterEach } from '@jest/globals';
import { prisma } from '../../src/lib/prisma.js';
import {
  getOrCreatePerson,
  createPerson,
  linkIdentity,
  findPersonByIdentity,
  getPersonIdentities,
  getPersonWithIdentities,
  mergePersons,
  getOrCreatePersonFromUser,
  updatePersonActivity,
  updatePersonTraits,
} from '../../src/lib/identity.js';

describe('Identity Resolution', () => {
  // Clean up test data after each test
  afterEach(async () => {
    await prisma.identityLink.deleteMany({
      where: {
        person: {
          email: {
            contains: 'test-identity-',
          },
        },
      },
    });
    await prisma.person.deleteMany({
      where: {
        email: {
          contains: 'test-identity-',
        },
      },
    });
  });

  describe('getOrCreatePerson', () => {
    test('should create a new person if none exists', async () => {
      const email = 'test-identity-new@example.com';

      const person = await getOrCreatePerson(email);

      expect(person).toBeDefined();
      expect(person.email).toBe(email);
      expect(person.firstSeenAt).toBeInstanceOf(Date);
      expect(person.lastSeenAt).toBeInstanceOf(Date);
    });

    test('should return existing person if email exists', async () => {
      const email = 'test-identity-existing@example.com';

      // Create person first
      const person1 = await getOrCreatePerson(email);
      const firstSeenAt = person1.firstSeenAt;

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Try to get person again
      const person2 = await getOrCreatePerson(email);

      expect(person2.id).toBe(person1.id);
      expect(person2.email).toBe(email);
      expect(person2.firstSeenAt.getTime()).toBe(firstSeenAt.getTime());
      expect(person2.lastSeenAt.getTime()).toBeGreaterThan(firstSeenAt.getTime());
    });
  });

  describe('createPerson', () => {
    test('should create a person with all fields', async () => {
      const person = await createPerson({
        email: 'test-identity-full@example.com',
        phone: '+1234567890',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(person.email).toBe('test-identity-full@example.com');
      expect(person.phone).toBe('+1234567890');
      expect(person.firstName).toBe('John');
      expect(person.lastName).toBe('Doe');
    });

    test('should create a person with minimal fields', async () => {
      const person = await createPerson({
        email: 'test-identity-minimal@example.com',
      });

      expect(person.email).toBe('test-identity-minimal@example.com');
      expect(person.phone).toBeNull();
      expect(person.firstName).toBeNull();
      expect(person.lastName).toBeNull();
    });
  });

  describe('linkIdentity', () => {
    test('should create a new identity link', async () => {
      const person = await getOrCreatePerson('test-identity-link@example.com');

      const link = await linkIdentity(person.id, 'posthog', 'ph_test_123');

      expect(link).toBeDefined();
      expect(link.personId).toBe(person.id);
      expect(link.source).toBe('posthog');
      expect(link.externalId).toBe('ph_test_123');
    });

    test('should not create duplicate links', async () => {
      const person = await getOrCreatePerson('test-identity-duplicate@example.com');

      const link1 = await linkIdentity(person.id, 'stripe', 'cus_test_456');
      const link2 = await linkIdentity(person.id, 'stripe', 'cus_test_456');

      expect(link1.id).toBe(link2.id);
      expect(link1.personId).toBe(person.id);
      expect(link2.personId).toBe(person.id);
    });

    test('should support multiple identity sources for same person', async () => {
      const person = await getOrCreatePerson('test-identity-multiple@example.com');

      await linkIdentity(person.id, 'user', 'user_123');
      await linkIdentity(person.id, 'posthog', 'ph_abc');
      await linkIdentity(person.id, 'stripe', 'cus_xyz');

      const identities = await getPersonIdentities(person.id);

      expect(identities).toHaveLength(3);
      expect(identities.map((i) => i.source)).toContain('user');
      expect(identities.map((i) => i.source)).toContain('posthog');
      expect(identities.map((i) => i.source)).toContain('stripe');
    });
  });

  describe('findPersonByIdentity', () => {
    test('should find person by identity', async () => {
      const email = 'test-identity-find@example.com';
      const person = await getOrCreatePerson(email);
      await linkIdentity(person.id, 'meta', 'fb_test_789');

      const foundPerson = await findPersonByIdentity('meta', 'fb_test_789');

      expect(foundPerson).toBeDefined();
      expect(foundPerson?.id).toBe(person.id);
      expect(foundPerson?.email).toBe(email);
    });

    test('should return null if identity not found', async () => {
      const foundPerson = await findPersonByIdentity('posthog', 'ph_nonexistent');

      expect(foundPerson).toBeNull();
    });
  });

  describe('getPersonIdentities', () => {
    test('should return all identities for a person', async () => {
      const person = await getOrCreatePerson('test-identity-getall@example.com');

      await linkIdentity(person.id, 'user', 'user_test_1');
      await linkIdentity(person.id, 'posthog', 'ph_test_2');
      await linkIdentity(person.id, 'stripe', 'cus_test_3');

      const identities = await getPersonIdentities(person.id);

      expect(identities).toHaveLength(3);
      expect(identities[0].source).toBe('user');
      expect(identities[1].source).toBe('posthog');
      expect(identities[2].source).toBe('stripe');
    });

    test('should return empty array if person has no identities', async () => {
      const person = await getOrCreatePerson('test-identity-none@example.com');

      const identities = await getPersonIdentities(person.id);

      expect(identities).toHaveLength(0);
    });
  });

  describe('getPersonWithIdentities', () => {
    test('should return person with all identities', async () => {
      const person = await getOrCreatePerson('test-identity-with@example.com');
      await linkIdentity(person.id, 'user', 'user_with_1');
      await linkIdentity(person.id, 'posthog', 'ph_with_2');

      const personWithIdentities = await getPersonWithIdentities(person.id);

      expect(personWithIdentities).toBeDefined();
      expect(personWithIdentities?.id).toBe(person.id);
      expect(personWithIdentities?.identityLinks).toHaveLength(2);
    });

    test('should return null if person not found', async () => {
      const personWithIdentities = await getPersonWithIdentities('nonexistent_id');

      expect(personWithIdentities).toBeNull();
    });
  });

  describe('updatePersonActivity', () => {
    test('should update lastSeenAt timestamp', async () => {
      const person = await getOrCreatePerson('test-identity-activity@example.com');
      const originalLastSeenAt = person.lastSeenAt;

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 10));

      await updatePersonActivity(person.id);

      const updatedPerson = await prisma.person.findUnique({
        where: { id: person.id },
      });

      expect(updatedPerson?.lastSeenAt.getTime()).toBeGreaterThan(originalLastSeenAt.getTime());
    });
  });

  describe('updatePersonTraits', () => {
    test('should update person traits', async () => {
      const person = await getOrCreatePerson('test-identity-traits@example.com');

      await updatePersonTraits(person.id, {
        activeDays: 10,
        coreActions: 25,
        lifetimeValue: 199.99,
      });

      const updatedPerson = await prisma.person.findUnique({
        where: { id: person.id },
      });

      expect(updatedPerson?.activeDays).toBe(10);
      expect(updatedPerson?.coreActions).toBe(25);
      expect(Number(updatedPerson?.lifetimeValue)).toBe(199.99);
    });
  });

  describe('mergePersons', () => {
    test('should merge two persons and move all data', async () => {
      // Create two persons
      const sourcePerson = await createPerson({
        email: 'test-identity-source@example.com',
        firstName: 'Source',
      });

      const targetPerson = await createPerson({
        email: 'test-identity-target@example.com',
        lastName: 'Target',
      });

      // Add identity to source
      await linkIdentity(sourcePerson.id, 'posthog', 'ph_source_123');

      // Add identity to target
      await linkIdentity(targetPerson.id, 'user', 'user_target_456');

      // Merge source into target
      await mergePersons(sourcePerson.id, targetPerson.id);

      // Verify source person is deleted
      const deletedSource = await prisma.person.findUnique({
        where: { id: sourcePerson.id },
      });
      expect(deletedSource).toBeNull();

      // Verify target person has both identities
      const targetIdentities = await getPersonIdentities(targetPerson.id);
      expect(targetIdentities).toHaveLength(2);
      expect(targetIdentities.map((i) => i.source)).toContain('posthog');
      expect(targetIdentities.map((i) => i.source)).toContain('user');

      // Verify target person has merged traits
      const mergedPerson = await prisma.person.findUnique({
        where: { id: targetPerson.id },
      });
      expect(mergedPerson?.firstName).toBe('Source');
      expect(mergedPerson?.lastName).toBe('Target');
    });
  });

  describe('getOrCreatePersonFromUser', () => {
    test('should create person and link to user', async () => {
      const userId = 'test_user_123';
      const email = 'test-identity-user@example.com';

      const person = await getOrCreatePersonFromUser(userId, email, 'Test', 'User');

      expect(person.email).toBe(email);
      expect(person.firstName).toBe('Test');
      expect(person.lastName).toBe('User');

      // Verify identity link was created
      const foundPerson = await findPersonByIdentity('user', userId);
      expect(foundPerson?.id).toBe(person.id);
    });

    test('should link existing person to user if email exists', async () => {
      const email = 'test-identity-existing-user@example.com';

      // Create person first
      const existingPerson = await getOrCreatePerson(email);

      // Now try to create from user
      const userId = 'test_user_456';
      const person = await getOrCreatePersonFromUser(userId, email);

      // Should return the same person
      expect(person.id).toBe(existingPerson.id);

      // Verify link was created
      const foundPerson = await findPersonByIdentity('user', userId);
      expect(foundPerson?.id).toBe(existingPerson.id);
    });
  });
});
