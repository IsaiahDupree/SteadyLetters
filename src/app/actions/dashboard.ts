'use server';

import { prisma } from '@/lib/prisma';

export async function getDashboardStats() {
    try {
        const userId = 'default-user'; // TODO: Get from auth

        const [recipientCount, templateCount, orderCount] = await Promise.all([
            prisma.recipient.count({ where: { userId } }),
            prisma.template.count({ where: { userId } }),
            prisma.order.count({ where: { userId } }),
        ]);

        const recentOrders = await prisma.order.findMany({
            where: { userId },
            include: {
                recipient: true,
                template: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 5,
        });

        return {
            recipientCount,
            templateCount,
            orderCount,
            recentOrders,
        };
    } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        return {
            recipientCount: 0,
            templateCount: 0,
            orderCount: 0,
            recentOrders: [],
        };
    }
}
