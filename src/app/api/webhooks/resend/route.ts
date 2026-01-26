import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { prisma } from '@/lib/prisma';
import { trackUnifiedEvent } from '@/lib/unified-events.js';

// Resend webhook event types
type ResendEventType =
  | 'email.sent'
  | 'email.delivered'
  | 'email.delivery_delayed'
  | 'email.complained'
  | 'email.bounced'
  | 'email.opened'
  | 'email.clicked';

interface ResendWebhookPayload {
  type: ResendEventType;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    tags?: { name: string; value: string }[];

    // For click events
    link?: string;

    // For bounce events
    bounce_type?: string;

    // Metadata
    user_agent?: string;
    ip_address?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature using Svix
    const svixId = request.headers.get('svix-id');
    const svixTimestamp = request.headers.get('svix-timestamp');
    const svixSignature = request.headers.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
      console.warn('[Resend Webhook] Missing Svix headers');
      return NextResponse.json(
        { error: 'Missing webhook signature headers' },
        { status: 400 }
      );
    }

    // Get the webhook secret from environment
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('[Resend Webhook] RESEND_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    // Get raw body for signature verification
    const body = await request.text();

    // Verify the webhook signature
    const wh = new Webhook(webhookSecret);
    let payload: ResendWebhookPayload;

    try {
      payload = wh.verify(body, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as ResendWebhookPayload;
    } catch (err) {
      console.warn('[Resend Webhook] Invalid signature:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Extract event data
    const { type, created_at, data } = payload;
    const { email_id, from, to, subject, tags, link, user_agent, ip_address } = data;

    console.log(`[Resend Webhook] Received event: ${type} for email ${email_id}`);

    // Extract person_id from tags if present
    const personIdTag = tags?.find(tag => tag.name === 'person_id');
    const personId = personIdTag?.value;

    // Extract campaign from tags if present
    const campaignTag = tags?.find(tag => tag.name === 'campaign');
    const campaign = campaignTag?.value;

    // Extract segment_id from tags if present
    const segmentIdTag = tags?.find(tag => tag.name === 'segment_id');
    const segmentId = segmentIdTag?.value;

    // Store EmailMessage if this is a sent/delivered event (first time we see this email)
    if (type === 'email.sent' || type === 'email.delivered') {
      // Check if email message already exists
      const existingMessage = await prisma.emailMessage.findUnique({
        where: { resendId: email_id },
      });

      if (!existingMessage && personId) {
        // Store the email message
        await prisma.emailMessage.create({
          data: {
            personId,
            resendId: email_id,
            from,
            to: to[0], // Take first recipient
            subject,
            tags: tags || [],
            campaign: campaign || null,
            segmentId: segmentId || null,
            sentAt: new Date(created_at),
          },
        });
        console.log(`[Resend Webhook] Stored EmailMessage for ${email_id}`);
      }
    }

    // Store EmailEvent for all event types
    let eventType: string;
    let clickedUrl: string | null = null;

    // Map Resend event types to our EmailEvent types
    switch (type) {
      case 'email.sent':
        eventType = 'sent';
        break;
      case 'email.delivered':
        eventType = 'delivered';
        break;
      case 'email.delivery_delayed':
        eventType = 'delayed';
        break;
      case 'email.bounced':
        eventType = 'bounced';
        break;
      case 'email.complained':
        eventType = 'complained';
        break;
      case 'email.opened':
        eventType = 'opened';
        break;
      case 'email.clicked':
        eventType = 'clicked';
        clickedUrl = link || null;
        break;
      default:
        eventType = type;
    }

    // Find the email message to attach the event to
    const emailMessage = await prisma.emailMessage.findUnique({
      where: { resendId: email_id },
    });

    if (emailMessage) {
      // Store the email event
      await prisma.emailEvent.create({
        data: {
          messageId: emailMessage.id,
          eventType,
          clickedUrl,
          userAgent: user_agent || null,
          ipAddress: ip_address || null,
          timestamp: new Date(created_at),
        },
      });
      console.log(`[Resend Webhook] Stored EmailEvent: ${eventType} for ${email_id}`);

      // Track unified events for opens and clicks
      if (personId && (eventType === 'opened' || eventType === 'clicked')) {
        const unifiedEventName = eventType === 'opened' ? 'email_opened' : 'email_clicked';

        await trackUnifiedEvent({
          personId,
          eventName: unifiedEventName,
          source: 'email',
          properties: {
            email_id,
            campaign: campaign || null,
            subject,
            ...(clickedUrl && { clicked_url: clickedUrl }),
          },
        });
        console.log(`[Resend Webhook] Tracked unified event: ${unifiedEventName}`);
      }
    } else {
      console.warn(`[Resend Webhook] EmailMessage not found for ${email_id}, skipping event storage`);
    }

    return NextResponse.json({
      received: true,
      eventType: type,
      emailId: email_id,
      personId: personId || null,
    });

  } catch (error) {
    console.error('[Resend Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Handle GET for webhook verification/testing
export async function GET() {
  return NextResponse.json({
    status: 'Resend webhook endpoint active',
    message: 'This endpoint accepts POST requests from Resend webhooks',
  });
}
