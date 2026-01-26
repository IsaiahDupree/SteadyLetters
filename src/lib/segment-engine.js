/**
 * Segment Engine (GDP-012)
 *
 * This module evaluates segment membership and triggers automations
 * based on person features and behavior.
 */
import { prisma } from './prisma';
import { getOrComputePersonFeatures } from './person-features';
// ============================
// Segment CRUD Operations
// ============================
/**
 * Create a new segment
 *
 * @param data - Segment data
 * @returns Created segment
 */
export async function createSegment(data) {
    return await prisma.segment.create({
        data: {
            name: data.name,
            description: data.description,
            rules: data.rules,
            enabled: data.enabled ?? true,
            actionType: data.actionType,
            actionConfig: data.actionConfig,
        },
    });
}
/**
 * Get a segment by ID
 *
 * @param segmentId - The segment's ID
 * @returns The segment, or null if not found
 */
export async function getSegment(segmentId) {
    return await prisma.segment.findUnique({
        where: { id: segmentId },
        include: {
            members: {
                where: { exitedAt: null },
                include: { person: true },
            },
        },
    });
}
/**
 * Get all segments
 *
 * @returns Array of all segments
 */
export async function getAllSegments() {
    return await prisma.segment.findMany({
        orderBy: { createdAt: 'desc' },
    });
}
/**
 * Update a segment
 *
 * @param segmentId - The segment's ID
 * @param data - Updated segment data
 * @returns Updated segment
 */
export async function updateSegment(segmentId, data) {
    return await prisma.segment.update({
        where: { id: segmentId },
        data: {
            ...(data.name && { name: data.name }),
            ...(data.description && { description: data.description }),
            ...(data.rules && { rules: data.rules }),
            ...(data.enabled !== undefined && { enabled: data.enabled }),
            ...(data.actionType && { actionType: data.actionType }),
            ...(data.actionConfig && { actionConfig: data.actionConfig }),
        },
    });
}
/**
 * Delete a segment
 *
 * @param segmentId - The segment's ID
 */
export async function deleteSegment(segmentId) {
    return await prisma.segment.delete({
        where: { id: segmentId },
    });
}
// ============================
// Segment Evaluation
// ============================
/**
 * Evaluate if a condition matches a value
 *
 * @param fieldValue - The value from the person/features
 * @param operator - The comparison operator
 * @param targetValue - The value to compare against
 * @returns True if condition matches
 */
function evaluateCondition(fieldValue, operator, targetValue) {
    switch (operator) {
        case 'eq':
            return fieldValue === targetValue;
        case 'neq':
            return fieldValue !== targetValue;
        case 'gt':
            return fieldValue > targetValue;
        case 'lt':
            return fieldValue < targetValue;
        case 'gte':
            return fieldValue >= targetValue;
        case 'lte':
            return fieldValue <= targetValue;
        case 'in':
            if (!Array.isArray(targetValue)) {
                return false;
            }
            return targetValue.includes(fieldValue);
        case 'contains':
            if (typeof fieldValue !== 'string') {
                return false;
            }
            return fieldValue.includes(targetValue);
        default:
            return false;
    }
}
/**
 * Get field value from person or features using dot notation
 *
 * @param obj - The object to get the value from
 * @param path - Dot notation path (e.g., 'features.activeDays', 'person.email')
 * @returns The field value
 */
function getFieldValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}
/**
 * Evaluate if a person matches segment rules
 *
 * @param personId - The person's ID
 * @param rules - The segment rules to evaluate
 * @returns True if person matches the rules
 */
export async function evaluatePersonAgainstRules(personId, rules) {
    // Get person data
    const person = await prisma.person.findUnique({
        where: { id: personId },
    });
    if (!person) {
        return false;
    }
    // Get or compute features
    const features = await getOrComputePersonFeatures(personId, 1, 90);
    if (!features) {
        return false;
    }
    // Create evaluation context
    const context = {
        person,
        features,
    };
    // Evaluate each condition
    const conditionResults = rules.conditions.map((condition) => {
        const fieldValue = getFieldValue(context, condition.field);
        return evaluateCondition(fieldValue, condition.operator, condition.value);
    });
    // Apply operator (AND or OR)
    if (rules.operator === 'AND') {
        return conditionResults.every((result) => result === true);
    }
    else {
        return conditionResults.some((result) => result === true);
    }
}
/**
 * Evaluate if a person matches a segment
 *
 * @param personId - The person's ID
 * @param segmentId - The segment's ID
 * @returns True if person matches the segment
 */
export async function evaluatePersonForSegment(personId, segmentId) {
    const segment = await prisma.segment.findUnique({
        where: { id: segmentId },
    });
    if (!segment || !segment.enabled) {
        return false;
    }
    return await evaluatePersonAgainstRules(personId, segment.rules);
}
// ============================
// Segment Membership Management
// ============================
/**
 * Add a person to a segment
 *
 * @param personId - The person's ID
 * @param segmentId - The segment's ID
 * @returns Created segment member record
 */
export async function addPersonToSegment(personId, segmentId) {
    return await prisma.segmentMember.upsert({
        where: {
            segmentId_personId: {
                segmentId,
                personId,
            },
        },
        update: {
            exitedAt: null, // Re-enter if previously exited
        },
        create: {
            segmentId,
            personId,
            enteredAt: new Date(),
        },
    });
}
/**
 * Remove a person from a segment
 *
 * @param personId - The person's ID
 * @param segmentId - The segment's ID
 * @returns Updated segment member record
 */
export async function removePersonFromSegment(personId, segmentId) {
    return await prisma.segmentMember.update({
        where: {
            segmentId_personId: {
                segmentId,
                personId,
            },
        },
        data: {
            exitedAt: new Date(),
        },
    });
}
/**
 * Check if a person is in a segment
 *
 * @param personId - The person's ID
 * @param segmentId - The segment's ID
 * @returns True if person is an active member
 */
export async function isPersonInSegment(personId, segmentId) {
    const member = await prisma.segmentMember.findUnique({
        where: {
            segmentId_personId: {
                segmentId,
                personId,
            },
        },
    });
    return member !== null && member.exitedAt === null;
}
/**
 * Update segment membership for a person
 *
 * Evaluates if the person matches the segment rules and updates membership accordingly.
 *
 * @param personId - The person's ID
 * @param segmentId - The segment's ID
 * @returns Object with membership status and action taken
 */
export async function updateSegmentMembership(personId, segmentId) {
    const matches = await evaluatePersonForSegment(personId, segmentId);
    const isCurrentlyMember = await isPersonInSegment(personId, segmentId);
    if (matches && !isCurrentlyMember) {
        // Person matches but is not a member - add them
        await addPersonToSegment(personId, segmentId);
        return { isMember: true, action: 'added' };
    }
    else if (!matches && isCurrentlyMember) {
        // Person doesn't match but is a member - remove them
        await removePersonFromSegment(personId, segmentId);
        return { isMember: false, action: 'removed' };
    }
    // No change needed
    return {
        isMember: isCurrentlyMember,
        action: 'no_change',
    };
}
/**
 * Get all active members of a segment
 *
 * @param segmentId - The segment's ID
 * @returns Array of person IDs
 */
export async function getSegmentMembers(segmentId) {
    const members = await prisma.segmentMember.findMany({
        where: {
            segmentId,
            exitedAt: null,
        },
        select: { personId: true },
    });
    return members.map((m) => m.personId);
}
/**
 * Get all segments a person is in
 *
 * @param personId - The person's ID
 * @returns Array of segment IDs
 */
export async function getPersonSegments(personId) {
    const memberships = await prisma.segmentMember.findMany({
        where: {
            personId,
            exitedAt: null,
        },
        select: { segmentId: true },
    });
    return memberships.map((m) => m.segmentId);
}
// ============================
// Batch Operations
// ============================
/**
 * Evaluate and update segment membership for all persons
 *
 * @param segmentId - The segment's ID
 * @param batchSize - Number of persons to process in parallel (default: 10)
 * @returns Summary of membership updates
 */
export async function evaluateSegmentForAllPersons(segmentId, batchSize = 10) {
    // Get all person IDs
    const persons = await prisma.person.findMany({
        select: { id: true },
    });
    const personIds = persons.map((p) => p.id);
    let added = 0;
    let removed = 0;
    let unchanged = 0;
    const errors = [];
    // Process in batches
    for (let i = 0; i < personIds.length; i += batchSize) {
        const batch = personIds.slice(i, i + batchSize);
        const results = await Promise.allSettled(batch.map(async (personId) => {
            const result = await updateSegmentMembership(personId, segmentId);
            return { personId, ...result };
        }));
        for (let j = 0; j < results.length; j++) {
            const result = results[j];
            const personId = batch[j];
            if (result.status === 'fulfilled') {
                const { action } = result.value;
                if (action === 'added') {
                    added++;
                }
                else if (action === 'removed') {
                    removed++;
                }
                else {
                    unchanged++;
                }
            }
            else {
                errors.push({
                    personId,
                    error: result.reason?.message || 'Unknown error',
                });
            }
        }
    }
    return {
        total: personIds.length,
        added,
        removed,
        unchanged,
        errors,
    };
}
/**
 * Evaluate all enabled segments for a person
 *
 * @param personId - The person's ID
 * @returns Summary of segment membership updates
 */
export async function evaluateAllSegmentsForPerson(personId) {
    const segments = await prisma.segment.findMany({
        where: { enabled: true },
        select: { id: true, name: true },
    });
    const results = await Promise.allSettled(segments.map(async (segment) => {
        const result = await updateSegmentMembership(personId, segment.id);
        return {
            segmentId: segment.id,
            segmentName: segment.name,
            ...result,
        };
    }));
    const successful = results
        .filter((r) => r.status === 'fulfilled')
        .map((r) => r.value);
    const failed = results
        .filter((r) => r.status === 'rejected')
        .map((r) => ({
        error: r.reason?.message || 'Unknown error',
    }));
    return {
        total: segments.length,
        successful,
        failed,
    };
}
// ============================
// Automation Triggers
// ============================
/**
 * Trigger segment automation when a person enters
 *
 * @param personId - The person's ID
 * @param segmentId - The segment's ID
 * @returns Result of automation trigger
 */
export async function triggerSegmentAutomation(personId, segmentId) {
    const segment = await prisma.segment.findUnique({
        where: { id: segmentId },
    });
    if (!segment || !segment.actionType || !segment.actionConfig) {
        return { triggered: false, error: 'No automation configured' };
    }
    try {
        switch (segment.actionType) {
            case 'email':
                // TODO: Trigger email campaign via Resend
                console.log('[Automation] Email trigger:', {
                    personId,
                    segmentId,
                    config: segment.actionConfig,
                });
                break;
            case 'meta_audience':
                // TODO: Add to Meta custom audience
                console.log('[Automation] Meta audience trigger:', {
                    personId,
                    segmentId,
                    config: segment.actionConfig,
                });
                break;
            case 'webhook':
                // TODO: Call webhook URL
                console.log('[Automation] Webhook trigger:', {
                    personId,
                    segmentId,
                    config: segment.actionConfig,
                });
                break;
            default:
                return { triggered: false, error: 'Unknown action type' };
        }
        return { triggered: true, type: segment.actionType };
    }
    catch (error) {
        console.error('[Automation] Trigger failed:', error);
        return {
            triggered: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
// ============================
// Statistics & Analytics
// ============================
/**
 * Get segment statistics
 *
 * @param segmentId - The segment's ID
 * @returns Segment statistics
 */
export async function getSegmentStatistics(segmentId) {
    const segment = await prisma.segment.findUnique({
        where: { id: segmentId },
        include: {
            members: true,
        },
    });
    if (!segment) {
        return null;
    }
    const activeMembers = segment.members.filter((m) => m.exitedAt === null);
    const exitedMembers = segment.members.filter((m) => m.exitedAt !== null);
    return {
        segmentId: segment.id,
        name: segment.name,
        enabled: segment.enabled,
        totalMembers: activeMembers.length,
        historicalMembers: segment.members.length,
        churnedMembers: exitedMembers.length,
        churnRate: segment.members.length > 0
            ? exitedMembers.length / segment.members.length
            : 0,
    };
}
/**
 * Get all segment statistics
 *
 * @returns Array of segment statistics
 */
export async function getAllSegmentStatistics() {
    const segments = await prisma.segment.findMany({
        select: { id: true },
    });
    const stats = await Promise.all(segments.map((s) => getSegmentStatistics(s.id)));
    return stats.filter((s) => s !== null);
}
