import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { getHandwritingStyles } from '@/lib/thanks-io';

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser(request);

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Fetch handwriting styles from Thanks.io API
        const styles = await getHandwritingStyles();

        return NextResponse.json({
            styles,
        });
    } catch (error) {
        console.error('Error fetching handwriting styles:', error);
        return NextResponse.json(
            { error: 'Failed to fetch handwriting styles' },
            { status: 500 }
        );
    }
}
