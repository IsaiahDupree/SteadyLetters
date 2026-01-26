/**
 * Identity Resolution & Linking for Growth Data Plane
 *
 * This module provides helper functions for managing Person records
 * and linking identities across different systems (PostHog, Stripe, Meta, User, etc.)
 */

import { prisma } from './prisma.js';

/**
 * Find or create a Person by email
 */
export async function getOrCreatePerson(email) {
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
 */
export async function createPerson(data) {
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
 */
export async function updatePersonActivity(personId) {
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
 */
export async function linkIdentity(personId, source, externalId) {
  return await prisma.identityLink.upsert({
    where: {
      source_externalId: {
        source,
        externalId,
      },
    },
    update: {
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
 */
export async function findPersonByIdentity(source, externalId) {
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
 */
export async function getPersonIdentities(personId) {
  return await prisma.identityLink.findMany({
    where: { personId },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * Find Person with all their linked identities
 */
export async function getPersonWithIdentities(personId) {
  return await prisma.person.findUnique({
    where: { id: personId },
    include: {
      identityLinks: true,
    },
  });
}

/**
 * Merge two Person records
 */
export async function mergePersons(sourcePersonId, targetPersonId) {
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
        // Create a copy without the id field
        const { id, ...featureData } = sourceFeatures;
        await tx.personFeatures.create({
          data: {
            ...featureData,
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

    // Update target person's traits
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
          firstName: targetPerson.firstName || sourcePerson.firstName,
          lastName: targetPerson.lastName || sourcePerson.lastName,
          phone: targetPerson.phone || sourcePerson.phone,
          activeDays: targetPerson.activeDays + sourcePerson.activeDays,
          coreActions: targetPerson.coreActions + sourcePerson.coreActions,
          lifetimeValue: targetPerson.lifetimeValue + sourcePerson.lifetimeValue,
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
 */
export async function getOrCreatePersonFromUser(userId, email, firstName, lastName) {
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
 */
export async function updatePersonTraits(personId, traits) {
  await prisma.person.update({
    where: { id: personId },
    data: {
      ...traits,
      updatedAt: new Date(),
    },
  });
}

/**
 * Get or create Person from Stripe customer
 * Links stripe_customer_id to person_id
 */
export async function getOrCreatePersonFromStripe(stripeCustomerId, email, firstName, lastName) {
  // First check if this stripe customer is already linked
  const existingPerson = await findPersonByIdentity('stripe', stripeCustomerId);
  if (existingPerson) {
    // Update last seen and return
    await updatePersonActivity(existingPerson.id);
    return existingPerson;
  }

  // Try to find person by email
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

  // Link stripe customer ID to person
  await linkIdentity(person.id, 'stripe', stripeCustomerId);

  return person;
}
