'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUserOrNull } from '@/lib/server-auth';
import { startOfWeek } from 'date-fns';

export async function getDashboardStats() {
    try {
        const user = await getCurrentUserOrNull();
        if (!user) {
            return {
                recipientCount: 0,
                templateCount: 0,
                orderCount: 0,
                ordersThisWeek: 0,
                recentOrders: [],
                usage: null,
            };
        }

        const userId = user.id;
        const weekStart = startOfWeek(new Date());

        const [recipientCount, templateCount, orderCount, ordersThisWeek, recentOrders, usage] = await Promise.all([
            prisma.recipient.count({ where: { userId } }),
            prisma.template.count({ where: { userId } }),
            prisma.order.count({ where: { userId } }),
            prisma.order.count({ 
                where: { 
                    userId,
                    createdAt: { gte: weekStart }
                } 
            }),
            prisma.order.findMany({
                where: { userId },
                include: {
                    recipient: true,
                    template: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take: 5,
            }),
            prisma.userUsage.findUnique({ where: { userId } }),
        ]);

        return {
            recipientCount,
            templateCount,
            orderCount,
            ordersThisWeek,
            recentOrders,
            usage,
        };
    } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        return {
            recipientCount: 0,
            templateCount: 0,
            orderCount: 0,
            ordersThisWeek: 0,
            recentOrders: [],
            usage: null,
        };
    }
}
