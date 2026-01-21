import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Cron job to reset usage counters on the 1st of each month
 *
 * This endpoint should be called by Vercel Cron on a monthly schedule.
 * It resets all usage counters (letterGenerations, imageGenerations, lettersSent)
 * for all users and updates their resetAt date to the next month.
 *
 * Authentication: Vercel Cron secret header
 */
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // If CRON_SECRET is configured, verify it
    if (cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    // Calculate the next reset date (1st of next month)
    const now = new Date();
    const nextResetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Reset all user usage counters
    const result = await prisma.userUsage.updateMany({
      data: {
        letterGenerations: 0,
        imageGenerations: 0,
        lettersSent: 0,
        voiceTranscriptions: 0,
        imageAnalyses: 0,
        postcardsSent: 0,
        lettersSentStandard: 0,
        greetingCardsSent: 0,
        windowlessLettersSent: 0,
        giftCardsSent: 0,
        resetAt: nextResetDate,
      },
    });

    console.log(`[CRON] Usage reset completed for ${result.count} users at ${now.toISOString()}`);

    return NextResponse.json({
      success: true,
      usersReset: result.count,
      resetAt: now.toISOString(),
      nextResetDate: nextResetDate.toISOString(),
    });
  } catch (error) {
    console.error('[CRON] Error resetting usage:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
