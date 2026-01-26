/**
 * Meta Conversions API (CAPI) Server-Side Tracking Endpoint
 *
 * Receives tracking events from the client and sends them to Meta CAPI
 * with server-side user data for better tracking accuracy
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { sendMetaCAPIEvent, createMetaCAPIEvent, type MetaCAPIUserData } from '@/lib/meta-capi';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, properties, eventId } = body;

    if (!event || !eventId) {
      return NextResponse.json(
        { error: 'Missing required fields: event, eventId' },
        { status: 400 }
      );
    }

    // Get user data from session
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Build user data for CAPI
    const userData: MetaCAPIUserData = {
      externalId: user?.id, // Our internal user ID
      email: user?.email,
      clientIpAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      clientUserAgent: request.headers.get('user-agent') || undefined,
      // Get Facebook cookies if available (from client)
      fbc: request.cookies.get('_fbc')?.value,
      fbp: request.cookies.get('_fbp')?.value,
    };

    // Create CAPI event
    const capiEvent = createMetaCAPIEvent(event, properties || {}, eventId, userData);

    if (!capiEvent) {
      // Event not mapped to CAPI - skip silently
      return NextResponse.json({ success: true, skipped: true });
    }

    // Send to Meta CAPI
    const success = await sendMetaCAPIEvent(capiEvent);

    if (!success) {
      console.error('[Meta CAPI API] Failed to send event');
      return NextResponse.json(
        { error: 'Failed to send event to Meta CAPI' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Meta CAPI API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
