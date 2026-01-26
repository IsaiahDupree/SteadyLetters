/**
 * API endpoints for individual segment operations
 *
 * GET /api/segments/[segmentId] - Get segment details
 * PATCH /api/segments/[segmentId] - Update segment
 * DELETE /api/segments/[segmentId] - Delete segment
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getSegment,
  updateSegment,
  deleteSegment,
  getSegmentStatistics,
} from '@/lib/segment-engine';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(
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
    const includeStats = searchParams.get('stats') === 'true';

    // Get segment
    const segment = await getSegment(segmentId);

    if (!segment) {
      return NextResponse.json({ error: 'Segment not found' }, { status: 404 });
    }

    // Optionally include statistics
    let stats = null;
    if (includeStats) {
      stats = await getSegmentStatistics(segmentId);
    }

    return NextResponse.json({
      segment,
      ...(stats && { stats }),
    });
  } catch (error) {
    console.error('[Segment] GET error:', error);

    return NextResponse.json(
      {
        error: 'Failed to get segment',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    // Parse request body
    const body = await request.json();
    const { name, description, rules, enabled, actionType, actionConfig } = body;

    // Update segment
    const segment = await updateSegment(segmentId, {
      name,
      description,
      rules,
      enabled,
      actionType,
      actionConfig,
    });

    return NextResponse.json(segment);
  } catch (error) {
    console.error('[Segment] PATCH error:', error);

    return NextResponse.json(
      {
        error: 'Failed to update segment',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Delete segment
    await deleteSegment(segmentId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Segment] DELETE error:', error);

    return NextResponse.json(
      {
        error: 'Failed to delete segment',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
