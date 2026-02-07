'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUserOrNull } from '@/lib/server-auth';
import { startOfMonth, startOfWeek, startOfDay, subMonths, subWeeks, subDays } from 'date-fns';

export interface AnalyticsData {
  // Overview metrics
  totalSpent: number;
  totalOrders: number;
  totalRecipients: number;
  totalTemplates: number;

  // Time-based metrics
  ordersThisMonth: number;
  ordersThisWeek: number;
  ordersToday: number;
  spentThisMonth: number;

  // Popular templates (top 5)
  popularTemplates: Array<{
    id: string;
    name: string;
    usage_count: number;
  }>;

  // Top recipients (top 5)
  topRecipients: Array<{
    id: string;
    name: string;
    order_count: number;
    last_sent: Date;
  }>;

  // Product type breakdown
  productBreakdown: {
    postcards: number;
    letters: number;
    greetingCards: number;
    windowlessLetters: number;
  };

  // Usage limits and remaining quota
  usage: {
    letterGenerations: { used: number; limit: number; remaining: number };
    imageGenerations: { used: number; limit: number; remaining: number };
    lettersSent: { used: number; limit: number; remaining: number };
    tier: string;
    resetAt: Date;
  } | null;

  // Historical trends (last 30 days)
  dailyOrders: Array<{
    date: string;
    count: number;
  }>;

  // Cost trends (last 12 months)
  monthlyCosts: Array<{
    month: string;
    cost: number;
  }>;
}

export async function getAnalyticsData(): Promise<AnalyticsData | null> {
  try {
    const user = await getCurrentUserOrNull();
    if (!user) {
      return null;
    }

    const userId = user.id;
    const now = new Date();
    const monthStart = startOfMonth(now);
    const weekStart = startOfWeek(now);
    const dayStart = startOfDay(now);
    const thirtyDaysAgo = subDays(now, 30);
    const twelveMonthsAgo = subMonths(now, 12);

    // Fetch all data in parallel
    const [
      totalOrders,
      totalRecipients,
      totalTemplates,
      ordersThisMonth,
      ordersThisWeek,
      ordersToday,
      usage,
      popularTemplatesData,
      topRecipientsData,
      dailyOrdersData,
      monthlyOrdersData,
    ] = await Promise.all([
      // Total orders
      prisma.order.count({ where: { userId } }),

      // Total recipients
      prisma.recipient.count({ where: { userId } }),

      // Total templates
      prisma.template.count({ where: { userId } }),

      // Orders this month
      prisma.order.count({
        where: {
          userId,
          createdAt: { gte: monthStart },
        },
      }),

      // Orders this week
      prisma.order.count({
        where: {
          userId,
          createdAt: { gte: weekStart },
        },
      }),

      // Orders today
      prisma.order.count({
        where: {
          userId,
          createdAt: { gte: dayStart },
        },
      }),

      // User usage stats
      prisma.userUsage.findUnique({ where: { userId } }),

      // Popular templates (top 5 by usage)
      prisma.template.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          _count: {
            select: { orders: true },
          },
        },
        orderBy: {
          orders: {
            _count: 'desc',
          },
        },
        take: 5,
      }),

      // Top recipients (top 5 by order count)
      prisma.recipient.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          orders: {
            select: {
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
          _count: {
            select: { orders: true },
          },
        },
        orderBy: {
          orders: {
            _count: 'desc',
          },
        },
        take: 5,
      }),

      // Daily orders for last 30 days
      prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
        SELECT
          DATE("createdAt") as date,
          COUNT(*)::int as count
        FROM "Order"
        WHERE "userId" = ${userId}
          AND "createdAt" >= ${thirtyDaysAgo}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `,

      // Monthly orders for last 12 months
      prisma.$queryRaw<Array<{ month: Date; count: bigint }>>`
        SELECT
          DATE_TRUNC('month', "createdAt") as month,
          COUNT(*)::int as count
        FROM "Order"
        WHERE "userId" = ${userId}
          AND "createdAt" >= ${twelveMonthsAgo}
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY month ASC
      `,
    ]);

    // Calculate total spent and monthly costs
    const totalSpent = usage?.totalSpent ? Number(usage.totalSpent) : 0;
    const spentThisMonth = await calculateSpentThisMonth(userId, monthStart);

    // Get product breakdown from UserUsage
    const productBreakdown = {
      postcards: usage?.postcardsSent || 0,
      letters: usage?.lettersSentStandard || 0,
      greetingCards: usage?.greetingCardsSent || 0,
      windowlessLetters: usage?.windowlessLettersSent || 0,
    };

    // Format popular templates
    const popularTemplates = popularTemplatesData.map(t => ({
      id: t.id,
      name: t.name,
      usage_count: t._count.orders,
    }));

    // Format top recipients
    const topRecipients = topRecipientsData
      .filter(r => r._count.orders > 0)
      .map(r => ({
        id: r.id,
        name: r.name,
        order_count: r._count.orders,
        last_sent: r.orders[0]?.createdAt || new Date(),
      }));

    // Format daily orders
    const dailyOrders = dailyOrdersData.map(d => ({
      date: d.date.toISOString().split('T')[0],
      count: Number(d.count),
    }));

    // Format monthly costs (estimate based on average order cost)
    const avgCostPerOrder = totalOrders > 0 ? totalSpent / totalOrders : 1.5;
    const monthlyCosts = monthlyOrdersData.map(m => ({
      month: m.month.toISOString().split('T')[0].substring(0, 7), // YYYY-MM
      cost: Number(m.count) * avgCostPerOrder,
    }));

    // Format usage data
    const usageData = usage
      ? {
          letterGenerations: {
            used: usage.letterGenerations,
            limit: getLimitForTier(usage.tier, 'letterGenerations'),
            remaining: Math.max(
              0,
              getLimitForTier(usage.tier, 'letterGenerations') - usage.letterGenerations
            ),
          },
          imageGenerations: {
            used: usage.imageGenerations,
            limit: getLimitForTier(usage.tier, 'imageGenerations'),
            remaining: Math.max(
              0,
              getLimitForTier(usage.tier, 'imageGenerations') - usage.imageGenerations
            ),
          },
          lettersSent: {
            used: usage.lettersSent,
            limit: getLimitForTier(usage.tier, 'lettersSent'),
            remaining: Math.max(
              0,
              getLimitForTier(usage.tier, 'lettersSent') - usage.lettersSent
            ),
          },
          tier: usage.tier,
          resetAt: usage.resetAt,
        }
      : null;

    return {
      totalSpent,
      totalOrders,
      totalRecipients,
      totalTemplates,
      ordersThisMonth,
      ordersThisWeek,
      ordersToday,
      spentThisMonth,
      popularTemplates,
      topRecipients,
      productBreakdown,
      usage: usageData,
      dailyOrders,
      monthlyCosts,
    };
  } catch (error) {
    console.error('Failed to fetch analytics data:', error);
    return null;
  }
}

async function calculateSpentThisMonth(userId: string, monthStart: Date): Promise<number> {
  // Calculate from MailOrder records created this month
  const mailOrders = await prisma.mailOrder.findMany({
    where: {
      userId,
      createdAt: { gte: monthStart },
    },
    select: {
      cost: true,
    },
  });

  return mailOrders.reduce((sum, order) => sum + Number(order.cost), 0);
}

function getLimitForTier(tier: string, field: string): number {
  const TIER_LIMITS = {
    FREE: {
      letterGenerations: 5,
      imageGenerations: 3,
      lettersSent: 2,
    },
    PRO: {
      letterGenerations: 50,
      imageGenerations: 25,
      lettersSent: 20,
    },
    BUSINESS: {
      letterGenerations: 999999,
      imageGenerations: 100,
      lettersSent: 100,
    },
  } as const;

  type TierType = keyof typeof TIER_LIMITS;
  type LimitField = keyof typeof TIER_LIMITS.FREE;

  const tierKey = (tier as TierType) || 'FREE';
  const fieldKey = field as LimitField;

  return TIER_LIMITS[tierKey][fieldKey] || 0;
}
