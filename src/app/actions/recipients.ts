'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getAuthenticatedUser } from '@/lib/api-auth';

async function getCurrentUser() {
    const user = await getAuthenticatedUser();
    if (!user) {
        throw new Error('Unauthorized. Please sign in.');
    }
    return user;
}

export async function createRecipient(data: {
    name: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zip: string;
    country?: string;
}) {
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

        const recipient = await prisma.recipient.create({
            data: {
                userId: user.id,
                name: data.name,
                address1: data.address1,
                address2: data.address2 || '',
                city: data.city,
                state: data.state,
                zip: data.zip,
                country: data.country || 'US',
            },
        });

        revalidatePath('/recipients');
        return { success: true, recipient };
    } catch (error: any) {
        console.error('Failed to create recipient:', error);
        return { success: false, error: error.message || 'Failed to create recipient' };
    }
}

export async function getRecipients() {
    try {
        const user = await getCurrentUser();
        
        const recipients = await prisma.recipient.findMany({
            where: {
                userId: user.id,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return recipients;
    } catch (error) {
        console.error('Failed to fetch recipients:', error);
        return [];
    }
}

export async function deleteRecipient(id: string) {
    try {
        const user = await getCurrentUser();
        
        // Verify the recipient belongs to the user
        const recipient = await prisma.recipient.findUnique({
            where: { id },
        });

        if (!recipient) {
            return { success: false, error: 'Recipient not found' };
        }

        if (recipient.userId !== user.id) {
            return { success: false, error: 'Unauthorized' };
        }

        await prisma.recipient.delete({
            where: { id },
        });
        revalidatePath('/recipients');
        return { success: true };
    } catch (error: any) {
        console.error('Failed to delete recipient:', error);
        return { success: false, error: error.message || 'Failed to delete recipient' };
    }
}
