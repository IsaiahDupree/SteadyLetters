import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/analytics/orders/route';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(() => ({
        auth: {
            getUser: vi.fn(() => ({
                data: { user: { id: 'test-user-id' } }
            }))
        }
    }))
}));

vi.mock('@/lib/prisma', () => ({
    prisma: {
        mailOrder: {
            findMany: vi.fn()
        }
    }
}));

describe('Analytics API', () => {
    it('calculates total spent correctly', async () => {
        const { prisma } = await import('@/lib/prisma');

        const mockOrders = [
            { cost: 10.50, recipientCount: 1, productType: 'postcard', createdAt: new Date() },
            { cost: 15.75, recipientCount: 2, productType: 'letter', createdAt: new Date() },
            { cost: 20.00, recipientCount: 1, productType: 'greeting', createdAt: new Date() }
        ];

        (prisma.mailOrder.findMany as any).mockResolvedValue(mockOrders);

        const req = new NextRequest('http://localhost:3000/api/analytics/orders');
        const response = await GET(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.totalSpent).toBe(46.25);
    });

    it('calculates average cost per order', async () => {
        const { prisma } = await import('@/lib/prisma');

        const mockOrders = [
            { cost: 10.00, recipientCount: 1, productType: 'postcard', createdAt: new Date() },
            { cost: 20.00, recipientCount: 1, productType: 'letter', createdAt: new Date() }
        ];

        (prisma.mailOrder.findMany as any).mockResolvedValue(mockOrders);

        const req = new NextRequest('http://localhost:3000/api/analytics/orders');
        const response = await GET(req);
        const data = await response.json();

        expect(data.averageCost).toBe(15.00);
    });

    it('groups orders by product type', async () => {
        const { prisma } = await import('@/lib/prisma');

        const mockOrders = [
            { cost: 10.00, recipientCount: 1, productType: 'postcard', createdAt: new Date() },
            { cost: 15.00, recipientCount: 1, productType: 'postcard', createdAt: new Date() },
            { cost: 20.00, recipientCount: 1, productType: 'letter', createdAt: new Date() }
        ];

        (prisma.mailOrder.findMany as any).mockResolvedValue(mockOrders);

        const req = new NextRequest('http://localhost:3000/api/analytics/orders');
        const response = await GET(req);
        const data = await response.json();

        expect(data.productBreakdown).toHaveLength(2);
        expect(data.productBreakdown[0]).toMatchObject({
            type: 'postcard',
            count: 2,
            cost: 25.00
        });
    });

    it('identifies most used product', async () => {
        const { prisma } = await import('@/lib/prisma');

        const mockOrders = [
            { cost: 10.00, recipientCount: 1, productType: 'postcard', createdAt: new Date() },
            { cost: 15.00, recipientCount: 1, productType: 'postcard', createdAt: new Date() },
            { cost: 20.00, recipientCount: 1, productType: 'letter', createdAt: new Date() }
        ];

        (prisma.mailOrder.findMany as any).mockResolvedValue(mockOrders);

        const req = new NextRequest('http://localhost:3000/api/analytics/orders');
        const response = await GET(req);
        const data = await response.json();

        expect(data.mostUsedProduct).toBe('postcard');
    });

    it('calculates monthly spending', async () => {
        const { prisma } = await import('@/lib/prisma');

        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const mockOrders = [
            { cost: 10.00, recipientCount: 1, productType: 'postcard', createdAt: now },
            { cost: 15.00, recipientCount: 1, productType: 'letter', createdAt: lastMonth }
        ];

        (prisma.mailOrder.findMany as any).mockResolvedValue(mockOrders);

        const req = new NextRequest('http://localhost:3000/api/analytics/orders');
        const response = await GET(req);
        const data = await response.json();

        expect(data.monthlySpent).toBe(10.00); // Only current month
    });

    it('generates 6-month trend', async () => {
        const { prisma } = await import('@/lib/prisma');

        (prisma.mailOrder.findMany as any).mockResolvedValue([]);

        const req = new NextRequest('http://localhost:3000/api/analytics/orders');
        const response = await GET(req);
        const data = await response.json();

        expect(data.monthlyTrend).toHaveLength(6);
        expect(data.monthlyTrend[0]).toHaveProperty('month');
        expect(data.monthlyTrend[0]).toHaveProperty('amount');
    });

    it('requires authentication', async () => {
        const { createClient } = await import('@/lib/supabase/server');

        (createClient as any).mockReturnValueOnce({
            auth: {
                getUser: vi.fn(() => ({ data: { user: null } }))
            }
        });

        const req = new NextRequest('http://localhost:3000/api/analytics/orders');
        const response = await GET(req);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
    });

    it('handles empty order history', async () => {
        const { prisma } = await import('@/lib/prisma');

        (prisma.mailOrder.findMany as any).mockResolvedValue([]);

        const req = new NextRequest('http://localhost:3000/api/analytics/orders');
        const response = await GET(req);
        const data = await response.json();

        expect(data.totalSpent).toBe(0);
        expect(data.averageCost).toBe(0);
        expect(data.mostUsedProduct).toBe('none');
        expect(data.productBreakdown).toHaveLength(0);
    });
});
