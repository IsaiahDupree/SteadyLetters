import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { getAnalyticsData } from '@/app/actions/analytics';

/**
 * GET /api/analytics/detailed
 *
 * Returns comprehensive analytics data including:
 * - Usage metrics and limits
 * - Popular templates
 * - Top recipients
 * - Product breakdown
 * - Historical trends
 */
export async function GET(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser(request);

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const analytics = await getAnalyticsData();

        if (!analytics) {
            return NextResponse.json(
                { error: 'Failed to fetch analytics data' },
                { status: 500 }
            );
        }

        return NextResponse.json(analytics);
    } catch (error: any) {
        console.error('Detailed analytics error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch detailed analytics' },
            { status: 500 }
        );
    }
}
