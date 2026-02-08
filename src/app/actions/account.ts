'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/server-auth';

export interface ReturnAddress {
  name?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export async function updateReturnAddress(data: ReturnAddress) {
  try {
    const user = await getCurrentUser();

    // Ensure user exists in Prisma
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        email: user.email || '',
      },
    });

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        returnName: data.name || null,
        returnAddress1: data.address1 || null,
        returnAddress2: data.address2 || null,
        returnCity: data.city || null,
        returnState: data.state || null,
        returnZip: data.zip || null,
        returnCountry: data.country || 'US',
      },
      select: {
        id: true,
        returnName: true,
        returnAddress1: true,
        returnAddress2: true,
        returnCity: true,
        returnState: true,
        returnZip: true,
        returnCountry: true,
      },
    });

    revalidatePath('/billing');
    return { success: true, returnAddress: updatedUser };
  } catch (error: any) {
    console.error('Failed to update return address:', error);
    return { success: false, error: error.message || 'Failed to update return address' };
  }
}

export async function getReturnAddress() {
  try {
    const user = await getCurrentUser();

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        returnName: true,
        returnAddress1: true,
        returnAddress2: true,
        returnCity: true,
        returnState: true,
        returnZip: true,
        returnCountry: true,
      },
    });

    if (!userData) {
      return { success: true, returnAddress: {} };
    }

    return {
      success: true,
      returnAddress: {
        name: userData.returnName,
        address1: userData.returnAddress1,
        address2: userData.returnAddress2,
        city: userData.returnCity,
        state: userData.returnState,
        zip: userData.returnZip,
        country: userData.returnCountry,
      },
    };
  } catch (error: any) {
    console.error('Failed to fetch return address:', error);
    return { success: false, error: error.message || 'Failed to fetch return address' };
  }
}
