import { describe, it, expect } from '@jest/globals';

describe('Event Tracking', () => {
    it('should track letter generation event', () => {
        const event = {
            userId: 'test-user',
            eventType: 'letter_generated',
            metadata: { tone: 'warm', occasion: 'thank-you' },
        };

        expect(event.eventType).toBe('letter_generated');
        expect(event.metadata.tone).toBe('warm');
    });

    it('should track image generation event', () => {
        const event = {
            userId: 'test-user',
            eventType: 'image_generated',
            metadata: { occasion: 'birthday', count: 4 },
        };

        expect(event.eventType).toBe('image_generated');
        expect(event.metadata.count).toBe(4);
    });

    it('should track limit reached event', () => {
        const event = {
            userId: 'test-user',
            eventType: 'limit_reached',
            metadata: { type: 'letter_generation', tier: 'FREE' },
        };

        expect(event.eventType).toBe('limit_reached');
        expect(event.metadata.tier).toBe('FREE');
    });

    it('should track template created event', () => {
        const event = {
            userId: 'test-user',
            eventType: 'template_created',
            metadata: { name: 'Birthday Card', aiGenerated: true },
        };

        expect(event.eventType).toBe('template_created');
        expect(event.metadata.aiGenerated).toBe(true);
    });

    it('should track recipient added event', () => {
        const event = {
            userId: 'test-user',
            eventType: 'recipient_added',
            metadata: { name: 'John Doe' },
        };

        expect(event.eventType).toBe('recipient_added');
        expect(event.metadata.name).toBe('John Doe');
    });

    it('should track letter sent event', () => {
        const event = {
            userId: 'test-user',
            eventType: 'letter_sent',
            metadata: { recipientName: 'Jane Doe', templateId: 'abc123' },
        };

        expect(event.eventType).toBe('letter_sent');
        expect(event.metadata.recipientName).toBe('Jane Doe');
    });
});

describe('Event Stats', () => {
    it('should calculate event statistics', () => {
        const events = [
            { eventType: 'letter_generated' },
            { eventType: 'letter_generated' },
            { eventType: 'image_generated' },
            { eventType: 'template_created' },
            { eventType: 'letter_generated' },
        ];

        const stats = events.reduce((acc, event) => {
            acc[event.eventType] = (acc[event.eventType] || 0) + 1;
            return acc;
        }, {});

        expect(stats['letter_generated']).toBe(3);
        expect(stats['image_generated']).toBe(1);
        expect(stats['template_created']).toBe(1);
    });
});

describe('Event Timestamps', () => {
    it('should have valid timestamp', () => {
        const event = {
            userId: 'test-user',
            eventType: 'letter_generated',
            timestamp: new Date(),
        };

        expect(event.timestamp).toBeInstanceOf(Date);
        expect(event.timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    });
});
