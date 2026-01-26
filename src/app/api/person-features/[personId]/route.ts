/**
 * API endpoint for person features
 *
 * GET /api/person-features/[personId] - Get features for a person
 * POST /api/person-features/[personId] - Compute features for a person
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getOrComputePersonFeatures,
  computeAndStorePersonFeatures,
} from '@/lib/person-features';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ personId: string }> }
) {
  try {
    const { personId } = await context.params;

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
    const maxAgeDays = parseInt(searchParams.get('maxAgeDays') || '1');
    const lookbackDays = parseInt(searchParams.get('lookbackDays') || '90');

    // Get or compute features
    const features = await getOrComputePersonFeatures(
      personId,
      maxAgeDays,
      lookbackDays
    );

    if (!features) {
      return NextResponse.json(
        { error: 'Failed to compute features' },
        { status: 500 }
      );
    }

    return NextResponse.json(features);
  } catch (error) {
    console.error('[PersonFeatures] GET error:', error);

    return NextResponse.json(
      {
        error: 'Failed to get features',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ personId: string }> }
) {
  try {
    const { personId } = await context.params;

    // Optional: Check authentication
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters or body
    const searchParams = request.nextUrl.searchParams;
    const lookbackDays = parseInt(searchParams.get('lookbackDays') || '90');

    // Compute and store features
    const features = await computeAndStorePersonFeatures(
      personId,
      lookbackDays
    );

    return NextResponse.json(features);
  } catch (error) {
    console.error('[PersonFeatures] POST error:', error);

    return NextResponse.json(
      {
        error: 'Failed to compute features',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
