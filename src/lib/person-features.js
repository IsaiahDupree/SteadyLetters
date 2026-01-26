/**
 * Person Features Computation (GDP-011)
 *
 * This module computes behavioral features for persons based on their unified events.
 * Features are used for segmentation, personalization, and analytics.
 */
import { prisma } from './prisma';
// ============================
// Feature Computation
// ============================
/**
 * Compute features for a person based on their events
 *
 * @param personId - The person's ID
 * @param lookbackDays - Number of days to look back for events (default: 90)
 * @returns Computed features
 */
export async function computePersonFeatures(personId, lookbackDays = 90) {
    // Get person data
    const person = await prisma.person.findUnique({
        where: { id: personId },
        include: {
            unifiedEvents: {
                where: {
                    timestamp: {
                        gte: new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000),
                    },
                },
                select: {
                    eventName: true,
                    timestamp: true,
                },
            },
        },
    });
    if (!person) {
        throw new Error(`Person not found: ${personId}`);
    }
    // Compute active days (count unique days with events)
    const activeDays = new Set(person.unifiedEvents.map((e) => e.timestamp.toISOString().split('T')[0])).size;
    // Compute core actions (letter_sent, subscription_started)
    const coreActions = person.unifiedEvents.filter((e) => ['letter_sent', 'subscription_started', 'purchase_completed'].includes(e.eventName)).length;
    // Compute pricing views
    const pricingViews = person.unifiedEvents.filter((e) => e.eventName === 'pricing_view').length;
    // Compute email opens
    const emailOpens = person.unifiedEvents.filter((e) => e.eventName === 'email_opened').length;
    // Compute email clicks
    const emailClicks = person.unifiedEvents.filter((e) => e.eventName === 'email_clicked').length;
    // Product-specific features
    const lettersCreated = person.unifiedEvents.filter((e) => e.eventName === 'letter_created').length;
    const lettersSent = person.unifiedEvents.filter((e) => e.eventName === 'letter_sent').length;
    const templatesCreated = person.unifiedEvents.filter((e) => e.eventName === 'template_created').length;
    const recipientsAdded = person.unifiedEvents.filter((e) => e.eventName === 'recipient_added').length;
    // Time-based features
    const daysSinceSignup = Math.floor((Date.now() - person.firstSeenAt.getTime()) / (24 * 60 * 60 * 1000));
    const daysSinceLastActive = Math.floor((Date.now() - person.lastSeenAt.getTime()) / (24 * 60 * 60 * 1000));
    return {
        activeDays,
        coreActions,
        pricingViews,
        emailOpens,
        emailClicks,
        lettersCreated,
        lettersSent,
        templatesCreated,
        recipientsAdded,
        daysSinceSignup,
        daysSinceLastActive,
    };
}
/**
 * Store computed features for a person
 *
 * @param personId - The person's ID
 * @param features - The computed features to store
 * @returns The updated PersonFeatures record
 */
export async function storePersonFeatures(personId, features) {
    return await prisma.personFeatures.upsert({
        where: { personId },
        update: {
            ...features,
            computedAt: new Date(),
        },
        create: {
            personId,
            ...features,
        },
    });
}
/**
 * Compute and store features for a person (convenience function)
 *
 * @param personId - The person's ID
 * @param lookbackDays - Number of days to look back for events (default: 90)
 * @returns The stored PersonFeatures record
 */
export async function computeAndStorePersonFeatures(personId, lookbackDays = 90) {
    const features = await computePersonFeatures(personId, lookbackDays);
    return await storePersonFeatures(personId, features);
}
// ============================
// Batch Operations
// ============================
/**
 * Compute features for multiple persons in batches
 *
 * @param personIds - Array of person IDs
 * @param batchSize - Number of persons to process in parallel (default: 10)
 * @param lookbackDays - Number of days to look back for events (default: 90)
 * @returns Array of results with success/failure status
 */
export async function computePersonFeaturesBatch(personIds, batchSize = 10, lookbackDays = 90) {
    const results = [];
    for (let i = 0; i < personIds.length; i += batchSize) {
        const batch = personIds.slice(i, i + batchSize);
        const batchResults = await Promise.allSettled(batch.map(async (personId) => {
            await computeAndStorePersonFeatures(personId, lookbackDays);
            return { personId, success: true };
        }));
        for (let j = 0; j < batchResults.length; j++) {
            const result = batchResults[j];
            const personId = batch[j];
            if (result.status === 'fulfilled') {
                results.push(result.value);
            }
            else {
                results.push({
                    personId,
                    success: false,
                    error: result.reason?.message || 'Unknown error',
                });
            }
        }
    }
    return results;
}
/**
 * Compute features for all persons
 *
 * @param batchSize - Number of persons to process in parallel (default: 10)
 * @param lookbackDays - Number of days to look back for events (default: 90)
 * @returns Summary of computation results
 */
export async function computeFeaturesForAllPersons(batchSize = 10, lookbackDays = 90) {
    // Get all person IDs
    const persons = await prisma.person.findMany({
        select: { id: true },
    });
    const personIds = persons.map((p) => p.id);
    // Compute features in batches
    const results = await computePersonFeaturesBatch(personIds, batchSize, lookbackDays);
    // Summarize results
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const errors = results
        .filter((r) => !r.success)
        .map((r) => ({ personId: r.personId, error: r.error || 'Unknown error' }));
    return {
        total: personIds.length,
        successful,
        failed,
        errors,
    };
}
// ============================
// Query Functions
// ============================
/**
 * Get features for a person
 *
 * @param personId - The person's ID
 * @returns The person's features, or null if not computed yet
 */
export async function getPersonFeatures(personId) {
    return await prisma.personFeatures.findUnique({
        where: { personId },
    });
}
/**
 * Check if features need recomputation
 *
 * @param personId - The person's ID
 * @param maxAgeDays - Maximum age in days before recomputation (default: 1)
 * @returns True if features should be recomputed
 */
export async function shouldRecomputeFeatures(personId, maxAgeDays = 1) {
    const features = await getPersonFeatures(personId);
    if (!features) {
        return true; // No features computed yet
    }
    const ageInMs = Date.now() - features.computedAt.getTime();
    const ageInDays = ageInMs / (24 * 60 * 60 * 1000);
    return ageInDays >= maxAgeDays;
}
/**
 * Get or compute features for a person
 *
 * @param personId - The person's ID
 * @param maxAgeDays - Maximum age in days before recomputation (default: 1)
 * @param lookbackDays - Number of days to look back for events (default: 90)
 * @returns The person's features
 */
export async function getOrComputePersonFeatures(personId, maxAgeDays = 1, lookbackDays = 90) {
    const shouldRecompute = await shouldRecomputeFeatures(personId, maxAgeDays);
    if (shouldRecompute) {
        return await computeAndStorePersonFeatures(personId, lookbackDays);
    }
    return await getPersonFeatures(personId);
}
// ============================
// Analytics Functions
// ============================
/**
 * Get persons by feature criteria
 *
 * @param criteria - Feature criteria to filter by
 * @returns Array of person IDs matching criteria
 */
export async function getPersonsByFeatures(criteria) {
    const features = await prisma.personFeatures.findMany({
        where: {
            ...(criteria.activeDaysMin !== undefined && {
                activeDays: { gte: criteria.activeDaysMin },
            }),
            ...(criteria.activeDaysMax !== undefined && {
                activeDays: { lte: criteria.activeDaysMax },
            }),
            ...(criteria.coreActionsMin !== undefined && {
                coreActions: { gte: criteria.coreActionsMin },
            }),
            ...(criteria.coreActionsMax !== undefined && {
                coreActions: { lte: criteria.coreActionsMax },
            }),
            ...(criteria.daysSinceLastActiveMin !== undefined && {
                daysSinceLastActive: { gte: criteria.daysSinceLastActiveMin },
            }),
            ...(criteria.daysSinceLastActiveMax !== undefined && {
                daysSinceLastActive: { lte: criteria.daysSinceLastActiveMax },
            }),
            ...(criteria.emailOpensMin !== undefined && {
                emailOpens: { gte: criteria.emailOpensMin },
            }),
            ...(criteria.lettersSentMin !== undefined && {
                lettersSent: { gte: criteria.lettersSentMin },
            }),
        },
        select: { personId: true },
    });
    return features.map((f) => f.personId);
}
/**
 * Get feature statistics across all persons
 *
 * @returns Summary statistics for all features
 */
export async function getFeatureStatistics() {
    const features = await prisma.personFeatures.findMany();
    if (features.length === 0) {
        return null;
    }
    const sum = (arr) => arr.reduce((a, b) => a + b, 0);
    const avg = (arr) => sum(arr) / arr.length;
    const median = (arr) => {
        const sorted = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0
            ? (sorted[mid - 1] + sorted[mid]) / 2
            : sorted[mid];
    };
    const activeDaysArr = features.map((f) => f.activeDays);
    const coreActionsArr = features.map((f) => f.coreActions);
    const lettersSentArr = features.map((f) => f.lettersSent);
    return {
        total: features.length,
        activeDays: {
            avg: avg(activeDaysArr),
            median: median(activeDaysArr),
            max: Math.max(...activeDaysArr),
        },
        coreActions: {
            avg: avg(coreActionsArr),
            median: median(coreActionsArr),
            max: Math.max(...coreActionsArr),
        },
        lettersSent: {
            avg: avg(lettersSentArr),
            median: median(lettersSentArr),
            max: Math.max(...lettersSentArr),
        },
    };
}
