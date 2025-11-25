import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser(request);

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get user usage for total spent
        const usage = await prisma.userUsage.findUnique({
            where: { userId: user.id },
        });

        // Fetch all orders for the user
        const orders = await prisma.order.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
        });

        // Calculate stats from orders
        const totalSpent = usage?.totalSpent ? Number(usage.totalSpent) : 0;
        const averageCost = orders.length > 0 ? totalSpent / orders.length : 0;

        return NextResponse.json({
            totalSpent,
            monthlySpent: 0, // TODO: Calculate from usage reset period
            averageCost,
            mostUsedProduct: 'postcard', // TODO: Calculate from product-specific counters
            productBreakdown: [],
            monthlyTrend: [],
        });
    } catch (error: any) {
        console.error('Analytics error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics' },
            { status: 500 }
        );
    }
}
