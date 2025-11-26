import { prisma } from './prisma';

export type EventType =
    | 'letter_generated'
    | 'image_generated'
    | 'template_created'
    | 'letter_sent'
    | 'recipient_added'
    | 'user_upgraded'
    | 'limit_reached'
    | 'voice_transcribed'
    | 'image_analyzed';

export interface EventData {
    userId: string;
    eventType: EventType;
    metadata?: Record<string, any>;
    timestamp?: Date;
}

export async function trackEvent(data: EventData) {
    try {
        await prisma.event.create({
            data: {
                userId: data.userId,
                eventType: data.eventType,
                metadata: data.metadata || {},
                timestamp: data.timestamp || new Date(),
            },
        });
    } catch (error) {
        console.error('Failed to track event:', error);
    }
}

export async function getEvents(userId: string, eventType?: EventType) {
    return prisma.event.findMany({
        where: {
            userId,
            ...(eventType && { eventType }),
        },
        orderBy: {
            timestamp: 'desc',
        },
    });
}

export async function getEventStats(userId: string) {
    const events = await prisma.event.findMany({
        where: { userId },
        select: { eventType: true },
    });

    const stats = events.reduce((acc: Record<string, number>, event: { eventType: string }) => {
        acc[event.eventType] = (acc[event.eventType] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return stats;
}
