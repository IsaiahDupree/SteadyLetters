'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/server-auth';
import type { RecipientInput } from '@/lib/validations/recipient';
import { validateAddress } from '@/lib/address-validation.js';

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

        // Validate address before creating recipient
        const validationResult = await validateAddress({
            address1: data.address1,
            address2: data.address2,
            city: data.city,
            state: data.state,
            zip: data.zip,
            country: data.country,
        });

        if (!validationResult.isValid) {
            const errorMessage = validationResult.messages?.[0] || 'Invalid address';
            return {
                success: false,
                error: `Address validation failed: ${errorMessage}`
            };
        }

        // Use corrected/standardized address if available
        const addressToSave = validationResult.corrected || {
            address1: data.address1,
            address2: data.address2,
            city: data.city,
            state: data.state,
            zip: data.zip,
            country: data.country || 'US',
        };

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
                address1: addressToSave.address1,
                address2: addressToSave.address2 || '',
                city: addressToSave.city,
                state: addressToSave.state,
                zip: addressToSave.zip,
                country: addressToSave.country || 'US',
            },
        });

        revalidatePath('/recipients');
        return {
            success: true,
            recipient,
            validated: validationResult.deliverable !== undefined ? validationResult.deliverable : true,
            corrected: validationResult.corrected !== undefined,
        };
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

        // Validate all addresses before importing
        const validationErrors: Array<{ rowNumber: number; errors: string[] }> = [];
        const validRecipients: RecipientInput[] = [];

        for (let i = 0; i < recipients.length; i++) {
            const recipient = recipients[i];
            const validationResult = await validateAddress({
                address1: recipient.address1,
                address2: recipient.address2 || undefined,
                city: recipient.city,
                state: recipient.state,
                zip: recipient.zip,
                country: recipient.country || undefined,
            });

            if (!validationResult.isValid) {
                validationErrors.push({
                    rowNumber: i + 1,
                    errors: validationResult.messages || ['Invalid address'],
                });
            } else {
                // Use corrected address if available
                const correctedAddress = validationResult.corrected || recipient;
                validRecipients.push({
                    name: recipient.name,
                    address1: correctedAddress.address1,
                    address2: correctedAddress.address2,
                    city: correctedAddress.city,
                    state: correctedAddress.state,
                    zip: correctedAddress.zip,
                    country: correctedAddress.country || 'US',
                });
            }
        }

        // If all recipients failed validation, return error
        if (validRecipients.length === 0) {
            return {
                success: false,
                imported: 0,
                failed: recipients.length,
                errors: validationErrors,
            };
        }

        // Bulk create valid recipients
        const createData = validRecipients.map(recipient => ({
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
            failed: validationErrors.length,
            errors: validationErrors.length > 0 ? validationErrors : undefined,
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
