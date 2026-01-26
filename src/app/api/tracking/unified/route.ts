/**
 * API endpoint for server-side unified event tracking
 *
 * This endpoint receives event data from the client-side tracking SDK
 * and stores it in the UnifiedEvent table.
 */

import { NextRequest, NextResponse } from 'next/server';
import { trackUnifiedEvent } from '@/lib/unified-events';
import { findPersonByIdentity } from '@/lib/identity';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventName, properties, source = 'web', attribution } = body;

    if (!eventName) {
      return NextResponse.json(
        { error: 'Event name is required' },
        { status: 400 }
      );
    }

    // Get current user from Supabase Auth
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let personId: string | undefined;

    // If user is authenticated, find or link their Person
    if (user) {
      try {
        const person = await findPersonByIdentity('user', user.id);
        personId = person?.id;
      } catch (error) {
        console.error('[UnifiedEvent API] Failed to find person:', error);
      }
    }

    // Track the unified event
    const event = await trackUnifiedEvent({
      personId,
      eventName,
      source,
      properties: {
        ...properties,
        user_id: user?.id, // Include user ID in properties for reference
      },
      sessionId: attribution?.sessionId,
      referrer: attribution?.referrer,
      utmSource: attribution?.utmSource,
      utmMedium: attribution?.utmMedium,
      utmCampaign: attribution?.utmCampaign,
    });

    return NextResponse.json({
      success: true,
      eventId: event.id,
    });
  } catch (error) {
    console.error('[UnifiedEvent API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to track event',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'unified-event-tracking',
  });
}
