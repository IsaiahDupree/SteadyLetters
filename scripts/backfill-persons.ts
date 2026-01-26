/**
 * Backfill Person records from User table
 *
 * This script creates Person records for all existing User records
 * and links them via IdentityLink with source='user'.
 *
 * Run this script once to migrate existing users to the Growth Data Plane.
 *
 * Usage:
 *   npx tsx scripts/backfill-persons.ts
 */

import { prisma } from '../src/lib/prisma';
import { getOrCreatePersonFromUser } from '../src/lib/identity';

interface MigrationStats {
  totalUsers: number;
  personsCreated: number;
  personsLinked: number;
  errors: number;
  errorDetails: Array<{ userId: string; email: string; error: string }>;
}

async function backfillPersons() {
  console.log('🚀 Starting Person backfill migration...\n');

  const stats: MigrationStats = {
    totalUsers: 0,
    personsCreated: 0,
    personsLinked: 0,
    errors: 0,
    errorDetails: [],
  };

  try {
    // Fetch all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });

    stats.totalUsers = users.length;
    console.log(`📊 Found ${stats.totalUsers} users to migrate\n`);

    // Process users in batches of 10
    const batchSize = 10;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);

      console.log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(users.length / batchSize)}...`);

      await Promise.all(
        batch.map(async (user) => {
          try {
            // Check if Person already exists for this email
            const existingPerson = await prisma.person.findUnique({
              where: { email: user.email },
            });

            // Check if IdentityLink already exists
            const existingLink = await prisma.identityLink.findUnique({
              where: {
                source_externalId: {
                  source: 'user',
                  externalId: user.id,
                },
              },
            });

            if (existingPerson && existingLink) {
              console.log(`  ✓ User ${user.email} already migrated (Person exists with link)`);
              return;
            }

            // Create or link person
            const person = await getOrCreatePersonFromUser(
              user.id,
              user.email
            );

            if (existingPerson) {
              console.log(`  ✓ Linked existing Person ${person.id} to User ${user.email}`);
              stats.personsLinked++;
            } else {
              console.log(`  ✓ Created Person ${person.id} for User ${user.email}`);
              stats.personsCreated++;
            }
          } catch (error) {
            stats.errors++;
            const errorMessage = error instanceof Error ? error.message : String(error);
            stats.errorDetails.push({
              userId: user.id,
              email: user.email,
              error: errorMessage,
            });
            console.error(`  ✗ Error processing user ${user.email}: ${errorMessage}`);
          }
        })
      );
    }

    console.log('\n✅ Migration complete!\n');
    console.log('📊 Migration Statistics:');
    console.log(`   Total Users: ${stats.totalUsers}`);
    console.log(`   Persons Created: ${stats.personsCreated}`);
    console.log(`   Persons Linked: ${stats.personsLinked}`);
    console.log(`   Errors: ${stats.errors}`);

    if (stats.errorDetails.length > 0) {
      console.log('\n❌ Errors encountered:');
      stats.errorDetails.forEach((error) => {
        console.log(`   - User ${error.email} (${error.userId}): ${error.error}`);
      });
    }

    console.log('\n🎉 Done!');
  } catch (error) {
    console.error('\n❌ Fatal error during migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
backfillPersons().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
