'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

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
        // For now, create with a default user ID (we'll add auth later)
        const recipient = await prisma.recipient.create({
            data: {
                userId: 'default-user', // TODO: Replace with actual user ID from auth
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
    } catch (error) {
        console.error('Failed to create recipient:', error);
        return { success: false, error: 'Failed to create recipient' };
    }
}

export async function getRecipients() {
    try {
        const recipients = await prisma.recipient.findMany({
            where: {
                userId: 'default-user', // TODO: Filter by actual user ID
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
        await prisma.recipient.delete({
            where: { id },
        });
        revalidatePath('/recipients');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete recipient:', error);
        return { success: false, error: 'Failed to delete recipient' };
    }
}
