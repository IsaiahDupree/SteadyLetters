'use server';

import { prisma } from '@/lib/prisma';
import { createServerClient } from '@/lib/supabase-server';
import { calculateNextSendDate } from '@/lib/recurring-letters';

async function getCurrentUser() {
  const supabase = createServerClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser?.email) {
    throw new Error('Unauthorized');
  }

  let user = await prisma.user.findUnique({
    where: { email: authUser.email },
  });

  if (!user) {
    user = await prisma.user.create({
      data: { email: authUser.email },
    });
  }

  return user;
}

export async function createRecurringLetter(data: {
  name: string;
  message: string;
  handwritingStyle?: string;
  recipientId: string;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
}) {
  try {
    const user = await getCurrentUser();

    // Verify recipient exists and belongs to user
    const recipient = await prisma.recipient.findUnique({
      where: { id: data.recipientId },
    });

    if (!recipient || recipient.userId !== user.id) {
      throw new Error('Recipient not found');
    }

    const nextSendAt = calculateNextSendDate(data.frequency);

    const recurringLetter = await prisma.recurringLetter.create({
      data: {
        userId: user.id,
        name: data.name,
        message: data.message,
        handwritingStyle: data.handwritingStyle,
        recipientId: data.recipientId,
        frequency: data.frequency,
        nextSendAt,
        active: true,
      },
    });

    return { success: true, id: recurringLetter.id };
  } catch (error) {
    console.error('Error creating recurring letter:', error);
    throw error;
  }
}

export async function getRecurringLetters() {
  try {
    const user = await getCurrentUser();

    const letters = await prisma.recurringLetter.findMany({
      where: { userId: user.id },
      include: {
        recipient: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return letters;
  } catch (error) {
    console.error('Error fetching recurring letters:', error);
    throw error;
  }
}

export async function getRecurringLetter(id: string) {
  try {
    const user = await getCurrentUser();

    const letter = await prisma.recurringLetter.findUnique({
      where: { id },
      include: {
        recipient: true,
        sentOrders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!letter || letter.userId !== user.id) {
      throw new Error('Recurring letter not found');
    }

    return letter;
  } catch (error) {
    console.error('Error fetching recurring letter:', error);
    throw error;
  }
}

export async function updateRecurringLetter(
  id: string,
  data: {
    name?: string;
    message?: string;
    handwritingStyle?: string;
    frequency?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    active?: boolean;
  }
) {
  try {
    const user = await getCurrentUser();

    const letter = await prisma.recurringLetter.findUnique({
      where: { id },
    });

    if (!letter || letter.userId !== user.id) {
      throw new Error('Recurring letter not found');
    }

    let nextSendAt = letter.nextSendAt;
    if (data.frequency && data.frequency !== letter.frequency) {
      nextSendAt = calculateNextSendDate(data.frequency);
    }

    const updated = await prisma.recurringLetter.update({
      where: { id },
      data: {
        ...data,
        nextSendAt: data.frequency ? nextSendAt : undefined,
        updatedAt: new Date(),
      },
    });

    return { success: true, id: updated.id };
  } catch (error) {
    console.error('Error updating recurring letter:', error);
    throw error;
  }
}

export async function deleteRecurringLetter(id: string) {
  try {
    const user = await getCurrentUser();

    const letter = await prisma.recurringLetter.findUnique({
      where: { id },
    });

    if (!letter || letter.userId !== user.id) {
      throw new Error('Recurring letter not found');
    }

    await prisma.recurringLetter.delete({
      where: { id },
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting recurring letter:', error);
    throw error;
  }
}

export async function pauseRecurringLetter(id: string) {
  return updateRecurringLetter(id, { active: false });
}

export async function resumeRecurringLetter(id: string) {
  return updateRecurringLetter(id, { active: true });
}
