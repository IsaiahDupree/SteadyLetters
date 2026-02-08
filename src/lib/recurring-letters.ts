/**
 * Recurring Letter Management Utilities
 * Handles scheduling and processing of recurring letters
 */

export type RecurrenceFrequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

/**
 * Calculate next send date based on frequency
 */
export function calculateNextSendDate(frequency: RecurrenceFrequency): Date {
  const now = new Date();

  switch (frequency) {
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'monthly':
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      return nextMonth;
    case 'quarterly':
      const nextQuarter = new Date(now);
      nextQuarter.setMonth(nextQuarter.getMonth() + 3);
      return nextQuarter;
    case 'yearly':
      const nextYear = new Date(now);
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      return nextYear;
    default:
      throw new Error(`Invalid frequency: ${frequency}`);
  }
}

/**
 * Check if a recurring letter is due to be sent
 */
export function isDueSoon(nextSendAt: Date, hoursBuffer: number = 24): boolean {
  const now = new Date();
  const bufferTime = new Date(now.getTime() + hoursBuffer * 60 * 60 * 1000);
  return nextSendAt <= bufferTime;
}

/**
 * Get human-readable frequency label
 */
export function getFrequencyLabel(frequency: RecurrenceFrequency): string {
  const labels: Record<RecurrenceFrequency, string> = {
    weekly: 'Weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly (3 months)',
    yearly: 'Yearly (12 months)',
  };
  return labels[frequency];
}

/**
 * Get all active recurring letters that are due to send
 * Used by cron job to process scheduled sends
 */
export async function getRecurringLettersDue(prisma: any) {
  const now = new Date();
  return prisma.recurringLetter.findMany({
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
}

/**
 * Format frequency for display
 */
export function formatFrequency(frequency: RecurrenceFrequency): string {
  return frequency.charAt(0).toUpperCase() + frequency.slice(1);
}

/**
 * Validate frequency value
 */
export function isValidFrequency(value: string): value is RecurrenceFrequency {
  return ['weekly', 'monthly', 'quarterly', 'yearly'].includes(value);
}
