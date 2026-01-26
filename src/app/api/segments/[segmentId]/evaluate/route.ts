/**
 * API endpoint to evaluate segment membership
 *
 * POST /api/segments/[segmentId]/evaluate - Evaluate all persons for a segment
 */

import { NextRequest, NextResponse } from 'next/server';
import { evaluateSegmentForAllPersons } from '@/lib/segment-engine';
import { createServerClient } from '@/lib/supabase/server';

export const maxDuration = 300; // 5 minutes

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ segmentId: string }> }
) {
  try {
    const { segmentId } = await context.params;

    // Optional: Check authentication
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const batchSize = parseInt(searchParams.get('batchSize') || '10');

    console.log('[Segment] Evaluating all persons for segment:', {
      segmentId,
      batchSize,
    });

    // Evaluate segment
    const result = await evaluateSegmentForAllPersons(segmentId, batchSize);

    console.log('[Segment] Evaluation complete:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Segment] Evaluate error:', error);

    return NextResponse.json(
      {
        error: 'Failed to evaluate segment',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
