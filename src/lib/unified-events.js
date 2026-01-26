/**
 * Unified Event Tracking for Growth Data Plane (GDP-003)
 * JavaScript implementation
 */

import { prisma } from './prisma.js';

/**
 * Track a unified event to the UnifiedEvent table
 *
 * @param {Object} data - Event data to track
 * @param {string} [data.personId] - The person ID
 * @param {string} data.eventName - The event name
 * @param {'web'|'app'|'email'|'stripe'|'meta'} data.source - The event source
 * @param {Object} [data.properties] - Event properties
 * @param {string} [data.sessionId] - Session ID
 * @param {string} [data.referrer] - Referrer URL
 * @param {string} [data.utmSource] - UTM source
 * @param {string} [data.utmMedium] - UTM medium
 * @param {string} [data.utmCampaign] - UTM campaign
 * @param {Date} [data.timestamp] - Event timestamp
 * @returns {Promise<Object>} The created UnifiedEvent record
 */
export async function trackUnifiedEvent(data) {
  try {
    const event = await prisma.unifiedEvent.create({
      data: {
        personId: data.personId || null,
        eventName: data.eventName,
        source: data.source,
        properties: data.properties || {},
        sessionId: data.sessionId,
        referrer: data.referrer,
        utmSource: data.utmSource,
        utmMedium: data.utmMedium,
        utmCampaign: data.utmCampaign,
        timestamp: data.timestamp || new Date(),
      },
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('[UnifiedEvent] Tracked:', {
        eventName: event.eventName,
        source: event.source,
        personId: event.personId,
      });
    }

    return event;
  } catch (error) {
    console.error('[UnifiedEvent] Failed to track event:', error);
    throw error;
  }
}

/**
 * Get all events for a person
 *
 * @param {string} personId - The person's ID
 * @param {number} [limit=50] - Maximum number of events to return
 * @returns {Promise<Array>} Array of UnifiedEvent records
 */
export async function getPersonEvents(personId, limit = 50) {
  return await prisma.unifiedEvent.findMany({
    where: { personId },
    orderBy: { timestamp: 'desc' },
    take: limit,
  });
}

/**
 * Get events by name for a person
 *
 * @param {string} personId - The person's ID
 * @param {string} eventName - The event name to filter by
 * @param {number} [limit=50] - Maximum number of events to return
 * @returns {Promise<Array>} Array of UnifiedEvent records
 */
export async function getPersonEventsByName(personId, eventName, limit = 50) {
  return await prisma.unifiedEvent.findMany({
    where: {
      personId,
      eventName,
    },
    orderBy: { timestamp: 'desc' },
    take: limit,
  });
}

/**
 * Get events by source
 *
 * @param {'web'|'app'|'email'|'stripe'|'meta'} source - The event source to filter by
 * @param {number} [limit=100] - Maximum number of events to return
 * @returns {Promise<Array>} Array of UnifiedEvent records
 */
export async function getEventsBySource(source, limit = 100) {
  return await prisma.unifiedEvent.findMany({
    where: { source },
    orderBy: { timestamp: 'desc' },
    take: limit,
  });
}

/**
 * Get event count by name for a person
 *
 * @param {string} personId - The person's ID
 * @param {string} [eventName] - The event name to count
 * @returns {Promise<number>} Event count
 */
export async function countPersonEvents(personId, eventName) {
  return await prisma.unifiedEvent.count({
    where: {
      personId,
      ...(eventName && { eventName }),
    },
  });
}

/**
 * Get event statistics for a person
 *
 * @param {string} personId - The person's ID
 * @returns {Promise<Object>} Object with event counts by name
 */
export async function getPersonEventStats(personId) {
  const events = await prisma.unifiedEvent.findMany({
    where: { personId },
    select: { eventName: true },
  });

  const stats = events.reduce((acc, event) => {
    acc[event.eventName] = (acc[event.eventName] || 0) + 1;
    return acc;
  }, {});

  return stats;
}

/**
 * Get events within a time range
 *
 * @param {string} personId - The person's ID
 * @param {Date} startDate - Start of the time range
 * @param {Date} [endDate] - End of the time range (defaults to now)
 * @returns {Promise<Array>} Array of UnifiedEvent records
 */
export async function getPersonEventsInRange(personId, startDate, endDate = new Date()) {
  return await prisma.unifiedEvent.findMany({
    where: {
      personId,
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { timestamp: 'desc' },
  });
}

/**
 * Get events with specific UTM parameters
 *
 * @param {string} personId - The person's ID
 * @param {Object} utmParams - UTM parameters to filter by
 * @param {string} [utmParams.utmSource] - UTM source
 * @param {string} [utmParams.utmMedium] - UTM medium
 * @param {string} [utmParams.utmCampaign] - UTM campaign
 * @returns {Promise<Array>} Array of UnifiedEvent records
 */
export async function getEventsByAttribution(personId, utmParams) {
  return await prisma.unifiedEvent.findMany({
    where: {
      personId,
      ...(utmParams.utmSource && { utmSource: utmParams.utmSource }),
      ...(utmParams.utmMedium && { utmMedium: utmParams.utmMedium }),
      ...(utmParams.utmCampaign && { utmCampaign: utmParams.utmCampaign }),
    },
    orderBy: { timestamp: 'desc' },
  });
}

/**
 * Get first event for a person (for attribution)
 *
 * @param {string} personId - The person's ID
 * @returns {Promise<Object|null>} First UnifiedEvent or null
 */
export async function getFirstEvent(personId) {
  return await prisma.unifiedEvent.findFirst({
    where: { personId },
    orderBy: { timestamp: 'asc' },
  });
}

/**
 * Get last event for a person (for recency)
 *
 * @param {string} personId - The person's ID
 * @returns {Promise<Object|null>} Last UnifiedEvent or null
 */
export async function getLastEvent(personId) {
  return await prisma.unifiedEvent.findFirst({
    where: { personId },
    orderBy: { timestamp: 'desc' },
  });
}

/**
 * Track a web event
 *
 * @param {string} eventName - The event name
 * @param {string} [personId] - The person ID
 * @param {Object} [properties] - Event properties
 * @param {Object} [attribution] - Attribution data
 * @returns {Promise<Object>} The created UnifiedEvent record
 */
export async function trackWebEvent(eventName, personId, properties, attribution) {
  return trackUnifiedEvent({
    personId,
    eventName,
    source: 'web',
    properties,
    ...attribution,
  });
}

/**
 * Track an app event (internal product events)
 *
 * @param {string} eventName - The event name
 * @param {string} personId - The person ID
 * @param {Object} [properties] - Event properties
 * @returns {Promise<Object>} The created UnifiedEvent record
 */
export async function trackAppEvent(eventName, personId, properties) {
  return trackUnifiedEvent({
    personId,
    eventName,
    source: 'app',
    properties,
  });
}

/**
 * Track an email event
 *
 * @param {string} eventName - The event name
 * @param {string} personId - The person ID
 * @param {Object} [properties] - Event properties
 * @returns {Promise<Object>} The created UnifiedEvent record
 */
export async function trackEmailEvent(eventName, personId, properties) {
  return trackUnifiedEvent({
    personId,
    eventName,
    source: 'email',
    properties,
  });
}

/**
 * Track a Stripe event
 *
 * @param {string} eventName - The event name
 * @param {string} personId - The person ID
 * @param {Object} [properties] - Event properties
 * @returns {Promise<Object>} The created UnifiedEvent record
 */
export async function trackStripeEvent(eventName, personId, properties) {
  return trackUnifiedEvent({
    personId,
    eventName,
    source: 'stripe',
    properties,
  });
}

/**
 * Track a Meta Pixel event
 *
 * @param {string} eventName - The event name
 * @param {string} [personId] - The person ID
 * @param {Object} [properties] - Event properties
 * @returns {Promise<Object>} The created UnifiedEvent record
 */
export async function trackMetaEvent(eventName, personId, properties) {
  return trackUnifiedEvent({
    personId,
    eventName,
    source: 'meta',
    properties,
  });
}

/**
 * Track multiple events at once
 *
 * @param {Array<Object>} events - Array of event data to track
 * @returns {Promise<Object>} Batch result with count
 */
export async function trackUnifiedEventBatch(events) {
  try {
    const result = await prisma.unifiedEvent.createMany({
      data: events.map((event) => ({
        personId: event.personId || null,
        eventName: event.eventName,
        source: event.source,
        properties: event.properties || {},
        sessionId: event.sessionId,
        referrer: event.referrer,
        utmSource: event.utmSource,
        utmMedium: event.utmMedium,
        utmCampaign: event.utmCampaign,
        timestamp: event.timestamp || new Date(),
      })),
      skipDuplicates: true,
    });

    if (process.env.NODE_ENV === 'development') {
      console.log(`[UnifiedEvent] Tracked ${result.count} events in batch`);
    }

    return result;
  } catch (error) {
    console.error('[UnifiedEvent] Failed to track batch events:', error);
    throw error;
  }
}
