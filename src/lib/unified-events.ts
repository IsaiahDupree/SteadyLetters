/**
 * Unified Event Tracking for Growth Data Plane (GDP-003)
 *
 * This module consolidates all events from various sources into the UnifiedEvent table.
 * Events can come from: web, app, email, stripe, meta
 */

import { prisma } from './prisma';

// ============================
// Types
// ============================

export type EventSource = 'web' | 'app' | 'email' | 'stripe' | 'meta';

export interface UnifiedEventData {
  personId?: string | null;
  eventName: string;
  source: EventSource;
  properties?: Record<string, any>;

  // Attribution data
  sessionId?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;

  // Timestamp (defaults to now)
  timestamp?: Date;
}

// ============================
// Main Tracking Function
// ============================

/**
 * Track a unified event to the UnifiedEvent table
 *
 * @param data - Event data to track
 * @returns The created UnifiedEvent record
 */
export async function trackUnifiedEvent(data: UnifiedEventData) {
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

// ============================
// Query Functions
// ============================

/**
 * Get all events for a person
 *
 * @param personId - The person's ID
 * @param limit - Maximum number of events to return (default: 50)
 */
export async function getPersonEvents(personId: string, limit = 50) {
  return await prisma.unifiedEvent.findMany({
    where: { personId },
    orderBy: { timestamp: 'desc' },
    take: limit,
  });
}

/**
 * Get events by name for a person
 *
 * @param personId - The person's ID
 * @param eventName - The event name to filter by
 * @param limit - Maximum number of events to return (default: 50)
 */
export async function getPersonEventsByName(
  personId: string,
  eventName: string,
  limit = 50
) {
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
 * @param source - The event source to filter by
 * @param limit - Maximum number of events to return (default: 100)
 */
export async function getEventsBySource(source: EventSource, limit = 100) {
  return await prisma.unifiedEvent.findMany({
    where: { source },
    orderBy: { timestamp: 'desc' },
    take: limit,
  });
}

/**
 * Get event count by name for a person
 *
 * @param personId - The person's ID
 * @param eventName - The event name to count
 */
export async function countPersonEvents(personId: string, eventName?: string) {
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
 * @param personId - The person's ID
 * @returns Object with event counts by name
 */
export async function getPersonEventStats(personId: string) {
  const events = await prisma.unifiedEvent.findMany({
    where: { personId },
    select: { eventName: true },
  });

  const stats = events.reduce((acc: Record<string, number>, event) => {
    acc[event.eventName] = (acc[event.eventName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return stats;
}

/**
 * Get events within a time range
 *
 * @param personId - The person's ID
 * @param startDate - Start of the time range
 * @param endDate - End of the time range (defaults to now)
 */
export async function getPersonEventsInRange(
  personId: string,
  startDate: Date,
  endDate: Date = new Date()
) {
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

// ============================
// Attribution Functions
// ============================

/**
 * Get events with specific UTM parameters
 *
 * @param personId - The person's ID
 * @param utmParams - UTM parameters to filter by
 */
export async function getEventsByAttribution(
  personId: string,
  utmParams: {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  }
) {
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
 * @param personId - The person's ID
 */
export async function getFirstEvent(personId: string) {
  return await prisma.unifiedEvent.findFirst({
    where: { personId },
    orderBy: { timestamp: 'asc' },
  });
}

/**
 * Get last event for a person (for recency)
 *
 * @param personId - The person's ID
 */
export async function getLastEvent(personId: string) {
  return await prisma.unifiedEvent.findFirst({
    where: { personId },
    orderBy: { timestamp: 'desc' },
  });
}

// ============================
// Standard Event Tracking Helpers
// ============================

/**
 * Track a web event
 */
export async function trackWebEvent(
  eventName: string,
  personId?: string,
  properties?: Record<string, any>,
  attribution?: {
    sessionId?: string;
    referrer?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  }
) {
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
 */
export async function trackAppEvent(
  eventName: string,
  personId: string,
  properties?: Record<string, any>
) {
  return trackUnifiedEvent({
    personId,
    eventName,
    source: 'app',
    properties,
  });
}

/**
 * Track an email event
 */
export async function trackEmailEvent(
  eventName: string,
  personId: string,
  properties?: Record<string, any>
) {
  return trackUnifiedEvent({
    personId,
    eventName,
    source: 'email',
    properties,
  });
}

/**
 * Track a Stripe event
 */
export async function trackStripeEvent(
  eventName: string,
  personId: string,
  properties?: Record<string, any>
) {
  return trackUnifiedEvent({
    personId,
    eventName,
    source: 'stripe',
    properties,
  });
}

/**
 * Track a Meta Pixel event
 */
export async function trackMetaEvent(
  eventName: string,
  personId?: string,
  properties?: Record<string, any>
) {
  return trackUnifiedEvent({
    personId,
    eventName,
    source: 'meta',
    properties,
  });
}

// ============================
// Batch Operations
// ============================

/**
 * Track multiple events at once
 *
 * @param events - Array of event data to track
 */
export async function trackUnifiedEventBatch(events: UnifiedEventData[]) {
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
