/**
 * Cron endpoint to compute person features
 *
 * This endpoint should be called periodically (e.g., daily) via Vercel Cron
 * to compute features for all persons.
 *
 * Authentication via CRON_SECRET environment variable
 */

import { NextRequest, NextResponse } from 'next/server';
import { computeFeaturesForAllPersons } from '@/lib/person-features';

export const maxDuration = 300; // 5 minutes

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json(
        { error: 'CRON_SECRET not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const batchSize = parseInt(searchParams.get('batchSize') || '10');
    const lookbackDays = parseInt(searchParams.get('lookbackDays') || '90');

    console.log('[Cron] Computing features for all persons', {
      batchSize,
      lookbackDays,
    });

    // Compute features
    const result = await computeFeaturesForAllPersons(batchSize, lookbackDays);

    console.log('[Cron] Feature computation complete', result);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[Cron] Feature computation failed:', error);

    return NextResponse.json(
      {
        error: 'Failed to compute features',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: 'Compute Features Cron',
      method: 'POST',
      auth: 'Bearer CRON_SECRET',
      params: {
        batchSize: 'optional, default 10',
        lookbackDays: 'optional, default 90',
      },
    },
    { status: 200 }
  );
}
