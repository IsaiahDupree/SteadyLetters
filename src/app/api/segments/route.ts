/**
 * API endpoints for segment management
 *
 * GET /api/segments - List all segments
 * POST /api/segments - Create a new segment
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSegment, getAllSegments } from '@/lib/segment-engine';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    // Optional: Check authentication
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all segments
    const segments = await getAllSegments();

    return NextResponse.json({ segments });
  } catch (error) {
    console.error('[Segments] GET error:', error);

    return NextResponse.json(
      {
        error: 'Failed to get segments',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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

    // Validate required fields
    if (!name || !description || !rules) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, rules' },
        { status: 400 }
      );
    }

    // Create segment
    const segment = await createSegment({
      name,
      description,
      rules,
      enabled,
      actionType,
      actionConfig,
    });

    return NextResponse.json(segment, { status: 201 });
  } catch (error) {
    console.error('[Segments] POST error:', error);

    return NextResponse.json(
      {
        error: 'Failed to create segment',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
