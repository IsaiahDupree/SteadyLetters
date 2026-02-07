import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPostcard, sendLetter } from '@/lib/thanks-io';

/**
 * Cron job to process scheduled orders
 *
 * This endpoint should be called by Vercel Cron (or similar) every 15 minutes
 * to check for and send any orders that are scheduled to be sent.
 *
 * Configuration in vercel.json:
 * ```json
 * {
 *   "crons": [{
 *     "path": "/api/cron/process-scheduled-orders",
 *     "schedule": "*/15 * * * *"
 *   }]
 * }
 * ```
 *
 * @route GET /api/cron/process-scheduled-orders
 * @auth CRON_SECRET header
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.warn('[Scheduled Orders] CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Cron not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn('[Scheduled Orders] Invalid cron secret');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const now = new Date();
    console.log(`[Scheduled Orders] Processing scheduled orders at ${now.toISOString()}`);

    // Find all orders scheduled for now or earlier that are still pending
    const scheduledOrders = await prisma.order.findMany({
      where: {
        scheduledFor: {
          lte: now,
        },
        status: 'scheduled',
        thanksIoOrderId: null, // Haven't been sent yet
      },
      include: {
        user: true,
        recipient: true,
        template: true,
      },
      orderBy: {
        scheduledFor: 'asc',
      },
    });

    console.log(`[Scheduled Orders] Found ${scheduledOrders.length} orders to process`);

    const results = {
      processed: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each scheduled order
    for (const order of scheduledOrders) {
      try {
        console.log(`[Scheduled Orders] Processing order ${order.id} for user ${order.userId}`);

        // Determine product type (default to postcard)
        const productType = order.template?.frontImageUrl ? 'postcard' : 'letter';

        let thanksIoOrderId: string | undefined;

        if (productType === 'postcard' && order.template) {
          // Send postcard
          const result = await sendPostcard({
            recipients: [{
              name: order.recipient.name,
              address: order.recipient.address1,
              city: order.recipient.city,
              province: order.recipient.state,
              postal_code: order.recipient.zip,
              country: order.recipient.country,
            }],
            message: order.template.message,
            front_image_url: order.template.frontImageUrl || undefined,
            handwriting_style: order.template.handwritingStyle,
          });

          thanksIoOrderId = result.id;
        } else if (order.template) {
          // Send letter
          const result = await sendLetter({
            recipients: [{
              name: order.recipient.name,
              address: order.recipient.address1,
              city: order.recipient.city,
              province: order.recipient.state,
              postal_code: order.recipient.zip,
              country: order.recipient.country,
            }],
            message: order.template.message,
            handwriting_style: order.template.handwritingStyle,
          });

          thanksIoOrderId = result.id;
        } else {
          throw new Error('No template found for order');
        }

        // Update order with Thanks.io order ID and status
        await prisma.order.update({
          where: { id: order.id },
          data: {
            thanksIoOrderId,
            status: 'queued',
          },
        });

        console.log(`[Scheduled Orders] Successfully sent order ${order.id} as ${thanksIoOrderId}`);
        results.processed++;

      } catch (error) {
        console.error(`[Scheduled Orders] Failed to process order ${order.id}:`, error);

        // Mark order as failed
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'failed',
          },
        });

        results.failed++;
        results.errors.push(`Order ${order.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`[Scheduled Orders] Complete: ${results.processed} processed, ${results.failed} failed`);

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      ...results,
    });

  } catch (error) {
    console.error('[Scheduled Orders] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process scheduled orders',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
