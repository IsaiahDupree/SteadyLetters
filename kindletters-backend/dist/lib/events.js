"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackEvent = trackEvent;
exports.getEvents = getEvents;
exports.getEventStats = getEventStats;
const prisma_1 = require("./prisma");
async function trackEvent(data) {
    try {
        await prisma_1.prisma.event.create({
            data: {
                userId: data.userId,
                eventType: data.eventType,
                metadata: data.metadata || {},
                timestamp: data.timestamp || new Date(),
            },
        });
    }
    catch (error) {
        console.error('Failed to track event:', error);
    }
}
async function getEvents(userId, eventType) {
    return prisma_1.prisma.event.findMany({
        where: {
            userId,
            ...(eventType && { eventType }),
        },
        orderBy: {
            timestamp: 'desc',
        },
    });
}
async function getEventStats(userId) {
    const events = await prisma_1.prisma.event.findMany({
        where: { userId },
        select: { eventType: true },
    });
    const stats = events.reduce((acc, event) => {
        acc[event.eventType] = (acc[event.eventType] || 0) + 1;
        return acc;
    }, {});
    return stats;
}
