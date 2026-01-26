import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Click Redirect Tracker (GDP-006)
 *
 * Attribution spine: email → click → session → conversion
 *
 * Flow:
 * 1. User clicks link in email
 * 2. Redirects to /api/track/click?url=...&email_id=...&person_id=...
 * 3. Stores click event in EmailEvent table
 * 4. Sets first-party attribution cookie with click data
 * 5. Redirects to original URL
 * 6. Cookie persists for 30 days for attribution tracking
 */

interface ClickParams {
  url: string;          // Original destination URL
  email_id: string;     // Email message ID (resendId)
  person_id?: string;   // Person ID (optional)
  campaign?: string;    // Campaign name (optional)
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Extract required parameters
    const url = searchParams.get('url');
    const emailId = searchParams.get('email_id');
    const personId = searchParams.get('person_id');
    const campaign = searchParams.get('campaign');

    // Validate required parameters
    if (!url) {
      return NextResponse.json(
        { error: 'Missing required parameter: url' },
        { status: 400 }
      );
    }

    if (!emailId) {
      return NextResponse.json(
        { error: 'Missing required parameter: email_id' },
        { status: 400 }
      );
    }

    // Validate URL format
    let destinationUrl: URL;
    try {
      destinationUrl = new URL(url);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Find the email message
    const emailMessage = await prisma.emailMessage.findUnique({
      where: { resendId: emailId },
    });

    if (!emailMessage) {
      console.warn(`[Click Tracker] Email message not found: ${emailId}`);
      // Still redirect to destination, but don't track
      return NextResponse.redirect(destinationUrl.toString());
    }

    // Store click event
    await prisma.emailEvent.create({
      data: {
        messageId: emailMessage.id,
        eventType: 'clicked',
        clickedUrl: url,
        userAgent: request.headers.get('user-agent') || null,
        ipAddress: getClientIp(request),
        timestamp: new Date(),
      },
    });

    console.log(`[Click Tracker] Tracked click: ${emailId} → ${url}`);

    // Create attribution cookie data
    const attribution = {
      source: 'email',
      email_id: emailId,
      person_id: personId || emailMessage.personId,
      campaign: campaign || emailMessage.campaign,
      clicked_url: url,
      clicked_at: new Date().toISOString(),
    };

    // Create response with redirect
    const response = NextResponse.redirect(destinationUrl.toString());

    // Set first-party attribution cookie (30 days)
    const cookieMaxAge = 30 * 24 * 60 * 60; // 30 days in seconds
    response.cookies.set('sl_attribution', JSON.stringify(attribution), {
      maxAge: cookieMaxAge,
      httpOnly: false, // Allow JS to read for client-side tracking
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('[Click Tracker] Error:', error);

    // Still redirect to destination URL on error (graceful degradation)
    const url = request.nextUrl.searchParams.get('url');
    if (url) {
      try {
        return NextResponse.redirect(url);
      } catch (e) {
        // If redirect fails, return error
        return NextResponse.json(
          { error: 'Tracking failed and redirect invalid' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Click tracking failed' },
      { status: 500 }
    );
  }
}

/**
 * Extract client IP address from request
 * Handles various proxy headers (Vercel, Cloudflare, etc.)
 */
function getClientIp(request: NextRequest): string | null {
  // Try Vercel/Cloudflare headers first
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP in the chain
    return forwardedFor.split(',')[0].trim();
  }

  // Try other common headers
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to CF-Connecting-IP (Cloudflare)
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) {
    return cfIp;
  }

  return null;
}
