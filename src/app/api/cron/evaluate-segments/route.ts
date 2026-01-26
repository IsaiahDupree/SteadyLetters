/**
 * Cron endpoint to evaluate all segments
 *
 * This endpoint should be called periodically (e.g., hourly) via Vercel Cron
 * to update segment memberships.
 *
 * Authentication via CRON_SECRET environment variable
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllSegments, evaluateSegmentForAllPersons } from '@/lib/segment-engine';

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const batchSize = parseInt(searchParams.get('batchSize') || '10');

    console.log('[Cron] Evaluating all segments', { batchSize });

    // Get all enabled segments
    const segments = await getAllSegments();
    const enabledSegments = segments.filter((s) => s.enabled);

    console.log('[Cron] Found', enabledSegments.length, 'enabled segments');

    // Evaluate each segment
    const results = [];
    for (const segment of enabledSegments) {
      try {
        const result = await evaluateSegmentForAllPersons(segment.id, batchSize);
        results.push({
          segmentId: segment.id,
          segmentName: segment.name,
          ...result,
        });
      } catch (error) {
        results.push({
          segmentId: segment.id,
          segmentName: segment.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    console.log('[Cron] Segment evaluation complete');

    return NextResponse.json({
      success: true,
      segmentsEvaluated: enabledSegments.length,
      results,
    });
  } catch (error) {
    console.error('[Cron] Segment evaluation failed:', error);

    return NextResponse.json(
      {
        error: 'Failed to evaluate segments',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: 'Evaluate Segments Cron',
      method: 'POST',
      auth: 'Bearer CRON_SECRET',
      params: {
        batchSize: 'optional, default 10',
      },
    },
    { status: 200 }
  );
}
