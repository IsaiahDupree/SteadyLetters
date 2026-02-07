import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { startOfMonth, format } from 'date-fns';

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser(request);

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const userId = user.id;
        const monthStart = startOfMonth(new Date());

        // Get user usage for product breakdown and total spent
        const usage = await prisma.userUsage.findUnique({
            where: { userId },
        });

        // Calculate total spent and average cost
        const totalSpent = usage?.totalSpent ? Number(usage.totalSpent) : 0;

        // Calculate monthly spending from MailOrder records
        const monthlyOrders = await prisma.mailOrder.findMany({
            where: {
                userId,
                createdAt: { gte: monthStart },
            },
            select: {
                cost: true,
            },
        });
        const monthlySpent = monthlyOrders.reduce((sum, order) => sum + Number(order.cost), 0);

        // Get all-time order count for average calculation
        const totalOrders = await prisma.order.count({ where: { userId } });
        const averageCost = totalOrders > 0 ? totalSpent / totalOrders : 0;

        // Build product breakdown from UserUsage
        const productBreakdown = [
            {
                type: 'postcard',
                count: usage?.postcardsSent || 0,
                cost: (usage?.postcardsSent || 0) * 1.14, // Estimated avg postcard cost
            },
            {
                type: 'letter',
                count: usage?.lettersSentStandard || 0,
                cost: (usage?.lettersSentStandard || 0) * 1.20,
            },
            {
                type: 'greeting_card',
                count: usage?.greetingCardsSent || 0,
                cost: (usage?.greetingCardsSent || 0) * 3.00,
            },
            {
                type: 'windowless_letter',
                count: usage?.windowlessLettersSent || 0,
                cost: (usage?.windowlessLettersSent || 0) * 2.52,
            },
        ].filter(p => p.count > 0);

        // Find most used product
        const mostUsedProduct =
            productBreakdown.length > 0
                ? productBreakdown.reduce((max, p) => (p.count > max.count ? p : max), productBreakdown[0])
                    .type
                : 'none';

        // Get monthly trend for last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyOrdersData = await prisma.$queryRaw<
            Array<{ month: Date; total_cost: number }>
        >`
            SELECT
                DATE_TRUNC('month', "createdAt") as month,
                SUM("cost")::decimal as total_cost
            FROM "MailOrder"
            WHERE "userId" = ${userId}
              AND "createdAt" >= ${sixMonthsAgo}
            GROUP BY DATE_TRUNC('month', "createdAt")
            ORDER BY month ASC
        `;

        const monthlyTrend = monthlyOrdersData.map(m => ({
            month: format(new Date(m.month), 'MMM yyyy'),
            amount: Number(m.total_cost) || 0,
        }));

        // Get total recipients count
        const totalRecipients = await prisma.recipient.count({ where: { userId } });

        return NextResponse.json({
            totalSpent,
            monthlySpent,
            averageCost,
            mostUsedProduct,
            productBreakdown,
            monthlyTrend,
            totalOrders,
            totalRecipients,
        });
    } catch (error: any) {
        console.error('Analytics error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics' },
            { status: 500 }
        );
    }
}
