/**
 * Identity Resolution & Linking for Growth Data Plane
 *
 * This module provides helper functions for managing Person records
 * and linking identities across different systems (PostHog, Stripe, Meta, User, etc.)
 *
 * Key concepts:
 * - Person: Canonical customer record
 * - IdentityLink: Links Person to external system IDs
 * - Identity Sources: 'user', 'posthog', 'stripe', 'meta', 'anonymous'
 */

import { prisma } from '@/lib/prisma';
import type { Person, IdentityLink } from '@prisma/client';

export type IdentitySource = 'user' | 'posthog' | 'stripe' | 'meta' | 'anonymous';

export interface CreatePersonData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
}

export interface PersonWithIdentities extends Person {
  identityLinks: IdentityLink[];
}

/**
 * Find or create a Person by email
 *
 * If the person exists, updates lastSeenAt timestamp.
 * If not, creates a new Person record.
 *
 * @example
 * const person = await getOrCreatePerson('user@example.com');
 */
export async function getOrCreatePerson(email: string): Promise<Person> {
  return await prisma.person.upsert({
    where: { email },
    update: {
      lastSeenAt: new Date(),
      updatedAt: new Date(),
    },
    create: {
      email,
      firstSeenAt: new Date(),
      lastSeenAt: new Date(),
    },
  });
}

/**
 * Create a Person from structured data
 *
 * @example
 * const person = await createPerson({
 *   email: 'user@example.com',
 *   firstName: 'John',
 *   lastName: 'Doe'
 * });
 */
export async function createPerson(data: CreatePersonData): Promise<Person> {
  return await prisma.person.create({
    data: {
      email: data.email,
      phone: data.phone,
      firstName: data.firstName,
      lastName: data.lastName,
      firstSeenAt: new Date(),
      lastSeenAt: new Date(),
    },
  });
}

/**
 * Update Person's lastSeenAt timestamp
 *
 * Call this whenever a person performs an action
 *
 * @example
 * await updatePersonActivity(personId);
 */
export async function updatePersonActivity(personId: string): Promise<void> {
  await prisma.person.update({
    where: { id: personId },
    data: {
      lastSeenAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

/**
 * Link an external identity to a Person
 *
 * Creates an IdentityLink record that maps an external system ID
 * (e.g., PostHog distinct_id, Stripe customer_id) to a Person.
 *
 * If the link already exists, returns the existing link.
 *
 * @example
 * // Link PostHog identity
 * await linkIdentity(personId, 'posthog', 'ph_abc123');
 *
 * // Link Stripe customer
 * await linkIdentity(personId, 'stripe', 'cus_xyz789');
 *
 * // Link Supabase Auth user
 * await linkIdentity(personId, 'user', userId);
 */
export async function linkIdentity(
  personId: string,
  source: IdentitySource,
  externalId: string
): Promise<IdentityLink> {
  return await prisma.identityLink.upsert({
    where: {
      source_externalId: {
        source,
        externalId,
      },
    },
    update: {
      // If link exists but points to different person, update it
      // This handles identity merging scenarios
      personId,
    },
    create: {
      personId,
      source,
      externalId,
    },
  });
}

/**
 * Find a Person by their identity in an external system
 *
 * @example
 * // Find person by PostHog ID
 * const person = await findPersonByIdentity('posthog', 'ph_abc123');
 *
 * // Find person by Stripe customer ID
 * const person = await findPersonByIdentity('stripe', 'cus_xyz789');
 *
 * // Find person by User ID
 * const person = await findPersonByIdentity('user', userId);
 */
export async function findPersonByIdentity(
  source: IdentitySource,
  externalId: string
): Promise<Person | null> {
  const link = await prisma.identityLink.findUnique({
    where: {
      source_externalId: {
        source,
        externalId,
      },
    },
    include: {
      person: true,
    },
  });

  return link?.person ?? null;
}

/**
 * Get all identities linked to a Person
 *
 * Returns all IdentityLink records for a Person
 *
 * @example
 * const identities = await getPersonIdentities(personId);
 * // [
 * //   { source: 'user', externalId: 'user_123' },
 * //   { source: 'posthog', externalId: 'ph_abc' },
 * //   { source: 'stripe', externalId: 'cus_xyz' }
 * // ]
 */
export async function getPersonIdentities(personId: string): Promise<IdentityLink[]> {
  return await prisma.identityLink.findMany({
    where: { personId },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * Find Person with all their linked identities
 *
 * @example
 * const person = await getPersonWithIdentities(personId);
 * console.log(person.identityLinks); // All linked identities
 */
export async function getPersonWithIdentities(personId: string): Promise<PersonWithIdentities | null> {
  return await prisma.person.findUnique({
    where: { id: personId },
    include: {
      identityLinks: true,
    },
  });
}

/**
 * Merge two Person records (advanced use case)
 *
 * Merges sourcePerson into targetPerson:
 * 1. Moves all identity links from source to target
 * 2. Moves all events, emails, subscriptions, etc.
 * 3. Deletes source person
 *
 * Use this when you discover two Person records represent the same person
 * (e.g., anonymous session later identified)
 *
 * @example
 * await mergePersons(anonymousPersonId, identifiedPersonId);
 */
export async function mergePersons(
  sourcePersonId: string,
  targetPersonId: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Move all identity links
    await tx.identityLink.updateMany({
      where: { personId: sourcePersonId },
      data: { personId: targetPersonId },
    });

    // Move all unified events
    await tx.unifiedEvent.updateMany({
      where: { personId: sourcePersonId },
      data: { personId: targetPersonId },
    });

    // Move all email messages
    await tx.emailMessage.updateMany({
      where: { personId: sourcePersonId },
      data: { personId: targetPersonId },
    });

    // Move all subscriptions
    await tx.personSubscription.updateMany({
      where: { personId: sourcePersonId },
      data: { personId: targetPersonId },
    });

    // Move all deals
    await tx.deal.updateMany({
      where: { personId: sourcePersonId },
      data: { personId: targetPersonId },
    });

    // Move segment memberships
    await tx.segmentMember.updateMany({
      where: { personId: sourcePersonId },
      data: { personId: targetPersonId },
    });

    // Copy person features if source has them and target doesn't
    const sourceFeatures = await tx.personFeatures.findUnique({
      where: { personId: sourcePersonId },
    });

    if (sourceFeatures) {
      const targetFeatures = await tx.personFeatures.findUnique({
        where: { personId: targetPersonId },
      });

      if (!targetFeatures) {
        await tx.personFeatures.create({
          data: {
            ...sourceFeatures,
            id: undefined, // Generate new ID
            personId: targetPersonId,
          },
        });
      }

      // Delete source features
      await tx.personFeatures.delete({
        where: { personId: sourcePersonId },
      }).catch(() => {
        // Ignore if already deleted
      });
    }

    // Update target person's traits (keep earliest firstSeenAt, latest lastSeenAt)
    const sourcePerson = await tx.person.findUnique({
      where: { id: sourcePersonId },
    });

    const targetPerson = await tx.person.findUnique({
      where: { id: targetPersonId },
    });

    if (sourcePerson && targetPerson) {
      await tx.person.update({
        where: { id: targetPersonId },
        data: {
          firstSeenAt: sourcePerson.firstSeenAt < targetPerson.firstSeenAt
            ? sourcePerson.firstSeenAt
            : targetPerson.firstSeenAt,
          lastSeenAt: sourcePerson.lastSeenAt > targetPerson.lastSeenAt
            ? sourcePerson.lastSeenAt
            : targetPerson.lastSeenAt,
          // Merge names if target doesn't have them
          firstName: targetPerson.firstName || sourcePerson.firstName,
          lastName: targetPerson.lastName || sourcePerson.lastName,
          phone: targetPerson.phone || sourcePerson.phone,
          // Sum computed traits
          activeDays: targetPerson.activeDays + sourcePerson.activeDays,
          coreActions: targetPerson.coreActions + sourcePerson.coreActions,
          lifetimeValue: targetPerson.lifetimeValue.add(sourcePerson.lifetimeValue),
        },
      });
    }

    // Finally, delete the source person
    await tx.person.delete({
      where: { id: sourcePersonId },
    });
  });
}

/**
 * Get or create Person from User record
 *
 * This is used for backfilling Person records from existing User table.
 * If Person with email exists, links the User ID to it.
 * If not, creates a new Person and links it.
 *
 * @example
 * const person = await getOrCreatePersonFromUser(user.id, user.email);
 */
export async function getOrCreatePersonFromUser(
  userId: string,
  email: string,
  firstName?: string,
  lastName?: string
): Promise<Person> {
  // Try to find existing person by email
  let person = await prisma.person.findUnique({
    where: { email },
  });

  // If no person exists, create one
  if (!person) {
    person = await prisma.person.create({
      data: {
        email,
        firstName,
        lastName,
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
      },
    });
  }

  // Link user ID to person
  await linkIdentity(person.id, 'user', userId);

  return person;
}

/**
 * Update Person's computed traits
 *
 * Updates activeDays, coreActions, and lifetimeValue
 *
 * @example
 * await updatePersonTraits(personId, {
 *   activeDays: 5,
 *   coreActions: 10,
 *   lifetimeValue: 99.99
 * });
 */
export async function updatePersonTraits(
  personId: string,
  traits: {
    activeDays?: number;
    coreActions?: number;
    lifetimeValue?: number;
  }
): Promise<void> {
  await prisma.person.update({
    where: { id: personId },
    data: {
      ...traits,
      updatedAt: new Date(),
    },
  });
}
