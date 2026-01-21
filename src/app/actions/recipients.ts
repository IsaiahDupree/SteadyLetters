'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/server-auth';
import type { RecipientInput } from '@/lib/validations/recipient';

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

export interface BulkImportResult {
    success: boolean;
    imported: number;
    failed: number;
    errors?: Array<{ rowNumber: number; errors: string[] }>;
}

export async function bulkImportRecipients(recipients: RecipientInput[]): Promise<BulkImportResult> {
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

        // Bulk create all recipients
        const createData = recipients.map(recipient => ({
            userId: user.id,
            name: recipient.name,
            address1: recipient.address1,
            address2: recipient.address2 || '',
            city: recipient.city,
            state: recipient.state,
            zip: recipient.zip,
            country: recipient.country || 'US',
        }));

        const result = await prisma.recipient.createMany({
            data: createData,
            skipDuplicates: true, // Skip if duplicate entries exist
        });

        revalidatePath('/recipients');

        return {
            success: true,
            imported: result.count,
            failed: 0,
        };
    } catch (error: any) {
        console.error('Failed to bulk import recipients:', error);
        return {
            success: false,
            imported: 0,
            failed: recipients.length,
            errors: [{ rowNumber: 0, errors: [error.message || 'Failed to import recipients'] }],
        };
    }
}
