import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createOrder } from '@/app/actions/orders';
import { calculateNextSendDate } from '@/lib/recurring-letters';
import { sendLetter } from '@/lib/thanks-io';

export const maxDuration = 300; // 5 minutes for Vercel

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();

    // Find all active recurring letters that are due to send
    const dueLetters = await prisma.recurringLetter.findMany({
      where: {
        active: true,
        nextSendAt: {
          lte: now,
        },
      },
      include: {
        user: true,
        recipient: true,
      },
    });

    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [] as any[],
    };

    for (const letter of dueLetters) {
      try {
        results.processed++;

        // Create order for this recurring letter
        const order = await prisma.order.create({
          data: {
            userId: letter.userId,
            recipientId: letter.recipientId,
            thanksIoOrderId: undefined,
            status: 'queued',
            recurringLetterId: letter.id,
          },
        });

        // Send via Thanks.io
        const response = await sendLetter({
          recipients: [{
            name: letter.recipient.name,
            address: letter.recipient.address1,
            address2: letter.recipient.address2 || undefined,
            city: letter.recipient.city,
            province: letter.recipient.state,
            postal_code: letter.recipient.zip,
            country: letter.recipient.country,
          }],
          message: letter.message,
          handwriting_style: letter.handwritingStyle || undefined,
        });

        if (response.id && response.status !== 'failed') {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              thanksIoOrderId: response.id,
              status: response.status,
            },
          });

          // Calculate next send date
          const nextSendAt = calculateNextSendDate(letter.frequency as any);

          // Update recurring letter
          await prisma.recurringLetter.update({
            where: { id: letter.id },
            data: {
              lastSentAt: now,
              nextSendAt,
            },
          });

          results.succeeded++;
        } else {
          await prisma.order.update({
            where: { id: order.id },
            data: { status: 'failed' },
          });
          results.failed++;
          results.errors.push({
            letterId: letter.id,
            error: response.error || 'Failed to send via Thanks.io',
          });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          letterId: letter.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error processing recurring letters:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
