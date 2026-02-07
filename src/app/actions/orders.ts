'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/server-auth';
import { sendPostcard, sendLetter, sendGreetingCard, ProductType, getOrderStatus } from '@/lib/thanks-io';
import { canGenerate } from '@/lib/tiers';
import { trackServerEvent } from '@/lib/posthog-server';
import { validateAddress } from '@/lib/address-validation.js';
import { trackAppEvent } from '@/lib/unified-events';
import { findPersonByIdentity } from '@/lib/identity';
import { parseTemplateVariables } from '@/lib/template-variables.js';

export async function createOrder(data: {
    recipientId: string;
    templateId?: string;
    message: string;
    productType: ProductType;
    frontImageUrl?: string;
    handwritingStyle?: string;
    handwritingColor?: string;
    scheduledFor?: Date | string; // Optional scheduled send date (SL-109)
}) {
    try {
        const user = await getCurrentUser();

        // Get recipient details
        const recipient = await prisma.recipient.findUnique({
            where: { id: data.recipientId },
        });

        if (!recipient || recipient.userId !== user.id) {
            return { success: false, error: 'Recipient not found or unauthorized' };
        }

        // Validate recipient address before sending
        const validationResult = await validateAddress({
            address1: recipient.address1,
            address2: recipient.address2 || undefined,
            city: recipient.city,
            state: recipient.state,
            zip: recipient.zip,
            country: recipient.country,
        });

        if (!validationResult.isValid) {
            const errorMessage = validationResult.messages?.[0] || 'Invalid address';
            return {
                success: false,
                error: `Cannot send to invalid address: ${errorMessage}. Please update the recipient's address.`
            };
        }

        // Warn if address is not deliverable (USPS validation failed)
        if (validationResult.deliverable === false) {
            return {
                success: false,
                error: 'Address validation failed. The address may not be deliverable. Please verify the recipient address.'
            };
        }

        // Check usage limits before creating order
        let usage = await prisma.userUsage.findUnique({
            where: { userId: user.id },
        });

        if (!usage) {
            // Create initial usage record if it doesn't exist
            const now = new Date();
            const resetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            usage = await prisma.userUsage.create({
                data: { userId: user.id, tier: 'FREE', resetAt },
            });
        }

        // Check if user can send (using 'letter' as it maps to lettersSent)
        if (!canGenerate(usage, 'letter')) {
            // Track limit reached event
            await trackServerEvent(user.id, 'limit_reached', {
                type: 'order_creation',
                tier: usage.tier,
            });

            return {
                success: false,
                error: 'You have reached your monthly sending limit. Please upgrade your plan.'
            };
        }

        // Parse scheduledFor date if provided
        const scheduledFor = data.scheduledFor
            ? typeof data.scheduledFor === 'string'
                ? new Date(data.scheduledFor)
                : data.scheduledFor
            : null;

        // Validate scheduled date is in the future
        if (scheduledFor && scheduledFor <= new Date()) {
            return {
                success: false,
                error: 'Scheduled date must be in the future'
            };
        }

        // Create order record first (scheduled or pending status)
        const order = await prisma.order.create({
            data: {
                userId: user.id,
                recipientId: data.recipientId,
                templateId: data.templateId || null,
                status: scheduledFor ? 'scheduled' : 'pending',
                scheduledFor,
            },
        });
        
        // Parse template variables in message
        const parsedMessage = parseTemplateVariables(data.message, {
            name: recipient.name,
            address1: recipient.address1,
            address2: recipient.address2,
            city: recipient.city,
            state: recipient.state,
            zip: recipient.zip,
            country: recipient.country,
            custom1: recipient.custom1,
            custom2: recipient.custom2,
            custom3: recipient.custom3,
            custom4: recipient.custom4,
        });

        // If scheduled for future, don't send now - just return the order
        if (scheduledFor) {
            revalidatePath('/orders');

            // Track scheduled order creation in PostHog
            await trackServerEvent(user.id, 'order_scheduled', {
                productType: data.productType,
                orderId: order.id,
                scheduledFor: scheduledFor.toISOString(),
                tier: usage.tier,
            });

            return {
                success: true,
                orderId: order.id,
                message: `Order scheduled for ${scheduledFor.toLocaleString()}`,
                scheduled: true,
            };
        }

        // Format recipient for Thanks.io
        const thanksRecipient = {
            name: recipient.name,
            address: recipient.address1,
            address2: recipient.address2 || undefined,
            city: recipient.city,
            province: recipient.state,
            postal_code: recipient.zip,
            country: recipient.country,
        };

        try {
            // Send via Thanks.io based on product type
            let response;
            const params = {
                recipients: [thanksRecipient],
                message: parsedMessage,
                front_image_url: data.frontImageUrl,
                handwriting_style: data.handwritingStyle || '1',
                handwriting_color: data.handwritingColor || 'blue',
            };
            
            switch (data.productType) {
                case 'postcard':
                    response = await sendPostcard(params);
                    break;
                case 'letter':
                    response = await sendLetter(params);
                    break;
                case 'greeting':
                    response = await sendGreetingCard(params);
                    break;
                default:
                    response = await sendPostcard(params);
            }
            
            // Update order with Thanks.io ID
            await prisma.order.update({
                where: { id: order.id },
                data: {
                    thanksIoOrderId: response.id,
                    status: response.status || 'queued',
                },
            });
            
            // Increment usage counter
            await prisma.userUsage.upsert({
                where: { userId: user.id },
                update: {
                    lettersSent: { increment: 1 },
                },
                create: {
                    userId: user.id,
                    lettersSent: 1,
                    tier: 'FREE',
                    resetAt: getNextResetDate(),
                },
            });

            // Track order creation in PostHog
            await trackServerEvent(user.id, 'order_created', {
                productType: data.productType,
                orderId: order.id,
                thanksIoId: response.id,
                tier: usage.tier,
            });

            // Track letter sent event
            await trackServerEvent(user.id, 'letter_sent', {
                letter_id: order.id,
                recipient_count: 1,
                mail_class: 'first_class',
                cost: 0, // TODO: Calculate actual cost from product type
            });

            // Track returning user if they've sent letters before
            // Before this send, lettersSent was not yet incremented, so if it's > 0, they're returning
            const previouslySent = usage.lettersSent || 0;
            if (previouslySent > 0) {
                await trackServerEvent(user.id, 'letter_returning_user', {});
            }

            // Track UnifiedEvent: letter_sent
            try {
                const person = await findPersonByIdentity('user', user.id);
                if (person) {
                    await trackAppEvent('letter_sent', person.id, {
                        letter_id: order.id,
                        recipient_count: 1,
                        product_type: data.productType,
                        thanks_io_id: response.id,
                        tier: usage.tier,
                    });
                }
            } catch (error) {
                console.error('[Order] Failed to track unified event:', error);
                // Don't fail the order if event tracking fails
            }

            revalidatePath('/orders');
            revalidatePath('/dashboard');

            return {
                success: true,
                orderId: order.id,
                thanksIoId: response.id,
                status: response.status,
            };
            
        } catch (sendError: any) {
            // Mark order as failed
            await prisma.order.update({
                where: { id: order.id },
                data: { status: 'failed' },
            });

            // Track order creation failure in PostHog
            await trackServerEvent(user.id, 'order_creation_failed', {
                productType: data.productType,
                orderId: order.id,
                error: sendError.message,
            });

            console.error('Thanks.io send error:', sendError);
            return { success: false, error: sendError.message || 'Failed to send via Thanks.io' };
        }
        
    } catch (error: any) {
        console.error('Failed to create order:', error);
        return { success: false, error: error.message || 'Failed to create order' };
    }
}

export async function getOrders() {
    try {
        const user = await getCurrentUser();
        
        const orders = await prisma.order.findMany({
            where: { userId: user.id },
            include: {
                recipient: true,
                template: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        
        return orders;
    } catch (error) {
        console.error('Failed to fetch orders:', error);
        return [];
    }
}

export async function getOrderById(id: string) {
    try {
        const user = await getCurrentUser();
        
        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                recipient: true,
                template: true,
            },
        });
        
        if (!order || order.userId !== user.id) {
            return null;
        }
        
        return order;
    } catch (error) {
        console.error('Failed to fetch order:', error);
        return null;
    }
}

export async function updateOrderStatus(id: string, status: string) {
    try {
        const user = await getCurrentUser();

        const order = await prisma.order.findUnique({ where: { id } });
        if (!order || order.userId !== user.id) {
            return { success: false, error: 'Order not found or unauthorized' };
        }

        await prisma.order.update({
            where: { id },
            data: { status },
        });

        revalidatePath('/orders');
        return { success: true };
    } catch (error: any) {
        console.error('Failed to update order status:', error);
        return { success: false, error: error.message || 'Failed to update order' };
    }
}

/**
 * Refresh order status from Thanks.io API
 * This fetches the latest status directly from Thanks.io and updates our database
 */
export async function refreshOrderStatus(id: string) {
    try {
        const user = await getCurrentUser();

        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                recipient: true,
                template: true,
            },
        });

        if (!order || order.userId !== user.id) {
            return { success: false, error: 'Order not found or unauthorized' };
        }

        if (!order.thanksIoOrderId) {
            return { success: false, error: 'No Thanks.io order ID found for this order' };
        }

        // Fetch latest status from Thanks.io API
        const thanksIoStatus = await getOrderStatus(order.thanksIoOrderId);

        if (!thanksIoStatus) {
            return { success: false, error: 'Could not fetch status from Thanks.io' };
        }

        // Update our database with the latest status
        const updatedOrder = await prisma.order.update({
            where: { id },
            data: { status: thanksIoStatus.status },
        });

        revalidatePath(`/orders/${id}`);
        revalidatePath('/orders');

        return {
            success: true,
            order: {
                ...updatedOrder,
                recipient: order.recipient,
                template: order.template,
            },
            latestStatus: thanksIoStatus,
        };
    } catch (error: any) {
        console.error('Failed to refresh order status:', error);
        return { success: false, error: error.message || 'Failed to refresh order status' };
    }
}

function getNextResetDate(): Date {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth;
}

/**
 * Reorder an existing order - creates a new order with the same details
 * This is useful for sending the same letter to the same recipient again
 */
export async function reorderOrder(orderId: string) {
    try {
        const user = await getCurrentUser();

        // Get the original order with all its details
        const originalOrder = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                recipient: true,
                template: true,
            },
        });

        if (!originalOrder || originalOrder.userId !== user.id) {
            return { success: false, error: 'Order not found or unauthorized' };
        }

        if (!originalOrder.recipient) {
            return { success: false, error: 'Cannot reorder: original order has no recipient information' };
        }

        // Extract the message from the template or reconstruct it
        const message = originalOrder.template?.message || '';

        if (!message) {
            return { success: false, error: 'Cannot reorder: original order has no message content' };
        }

        // Create a new order using the createOrder function with the original details
        // Note: We'll use 'postcard' as the default product type since we don't have it stored
        // In a future update, we should add productType to the Order model
        const result = await createOrder({
            recipientId: originalOrder.recipientId,
            templateId: originalOrder.templateId || undefined,
            message: message,
            productType: 'postcard', // Default - should be stored in future
            handwritingStyle: '1', // Default - should be stored in future
            handwritingColor: 'blue', // Default - should be stored in future
        });

        if (result.success) {
            // Track reorder event
            await trackServerEvent(user.id, 'order_reordered', {
                originalOrderId: orderId,
                newOrderId: result.orderId,
                recipientId: originalOrder.recipientId,
            });
        }

        return result;
    } catch (error: any) {
        console.error('Failed to reorder:', error);
        return { success: false, error: error.message || 'Failed to reorder' };
    }
}

export async function createBulkOrder(data: {
    recipientIds: string[];
    templateId?: string;
    message: string;
    productType: ProductType;
    frontImageUrl?: string;
    handwritingStyle?: string;
    handwritingColor?: string;
}) {
    try {
        const user = await getCurrentUser();

        // Validate recipient IDs
        if (!data.recipientIds || data.recipientIds.length === 0) {
            return { success: false, error: 'No recipients selected' };
        }

        // Get all recipients
        const recipients = await prisma.recipient.findMany({
            where: {
                id: { in: data.recipientIds },
                userId: user.id,
            },
        });

        if (recipients.length !== data.recipientIds.length) {
            return { success: false, error: 'Some recipients not found or unauthorized' };
        }

        // Check usage limits before creating orders
        let usage = await prisma.userUsage.findUnique({
            where: { userId: user.id },
        });

        if (!usage) {
            // Create initial usage record if it doesn't exist
            const now = new Date();
            const resetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            usage = await prisma.userUsage.create({
                data: { userId: user.id, tier: 'FREE', resetAt },
            });
        }

        // Check if user can send all letters (need to check available count)
        const requiredCount = data.recipientIds.length;
        // We'll check each send individually to properly handle usage limits

        const results = [];
        let successCount = 0;
        let failCount = 0;

        for (const recipient of recipients) {
            // Validate recipient address before sending
            const validationResult = await validateAddress({
                address1: recipient.address1,
                address2: recipient.address2 || undefined,
                city: recipient.city,
                state: recipient.state,
                zip: recipient.zip,
                country: recipient.country,
            });

            if (!validationResult.isValid || validationResult.deliverable === false) {
                const errorMessage = validationResult.messages?.[0] || 'Invalid address';
                results.push({
                    recipientId: recipient.id,
                    recipientName: recipient.name,
                    success: false,
                    error: `Address validation failed: ${errorMessage}`,
                });
                failCount++;
                continue;
            }

            // Re-fetch usage for each iteration to get updated counts
            const currentUsage = await prisma.userUsage.findUnique({
                where: { userId: user.id },
            });

            if (!currentUsage || !canGenerate(currentUsage, 'letter')) {
                // Track limit reached event
                await trackServerEvent(user.id, 'limit_reached', {
                    type: 'bulk_order_creation',
                    tier: currentUsage?.tier || 'FREE',
                    successCount,
                    failCount: failCount + 1,
                });

                results.push({
                    recipientId: recipient.id,
                    recipientName: recipient.name,
                    success: false,
                    error: 'Monthly sending limit reached',
                });
                failCount++;
                continue;
            }

            // Create order record first (pending status)
            const order = await prisma.order.create({
                data: {
                    userId: user.id,
                    recipientId: recipient.id,
                    templateId: data.templateId || null,
                    status: 'pending',
                },
            });

            // Format recipient for Thanks.io
            const thanksRecipient = {
                name: recipient.name,
                address: recipient.address1,
                address2: recipient.address2 || undefined,
                city: recipient.city,
                province: recipient.state,
                postal_code: recipient.zip,
                country: recipient.country,
            };

            try {
                // Send via Thanks.io based on product type
                let response;
                const params = {
                    recipients: [thanksRecipient],
                    message: data.message,
                    front_image_url: data.frontImageUrl,
                    handwriting_style: data.handwritingStyle || '1',
                    handwriting_color: data.handwritingColor || 'blue',
                };

                switch (data.productType) {
                    case 'postcard':
                        response = await sendPostcard(params);
                        break;
                    case 'letter':
                        response = await sendLetter(params);
                        break;
                    case 'greeting':
                        response = await sendGreetingCard(params);
                        break;
                    default:
                        response = await sendPostcard(params);
                }

                // Update order with Thanks.io ID
                await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        thanksIoOrderId: response.id,
                        status: response.status || 'queued',
                    },
                });

                // Increment usage counter
                await prisma.userUsage.upsert({
                    where: { userId: user.id },
                    update: {
                        lettersSent: { increment: 1 },
                    },
                    create: {
                        userId: user.id,
                        lettersSent: 1,
                        tier: 'FREE',
                        resetAt: getNextResetDate(),
                    },
                });

                // Track letter sent event
                await trackServerEvent(user.id, 'letter_sent', {
                    letter_id: order.id,
                    recipient_count: 1,
                    mail_class: 'first_class',
                    cost: 0, // TODO: Calculate actual cost from product type
                });

                // Track returning user if they've sent letters before
                // Re-check current usage to see if this is their first or subsequent send
                const updatedUsage = await prisma.userUsage.findUnique({
                    where: { userId: user.id },
                });
                const totalSent = updatedUsage?.lettersSent || 0;
                if (totalSent > 1) {
                    await trackServerEvent(user.id, 'letter_returning_user', {});
                }

                results.push({
                    recipientId: recipient.id,
                    recipientName: recipient.name,
                    success: true,
                    orderId: order.id,
                    thanksIoId: response.id,
                    status: response.status,
                });
                successCount++;

            } catch (sendError: any) {
                // Mark order as failed
                await prisma.order.update({
                    where: { id: order.id },
                    data: { status: 'failed' },
                });

                console.error('Thanks.io send error:', sendError);
                results.push({
                    recipientId: recipient.id,
                    recipientName: recipient.name,
                    success: false,
                    error: sendError.message || 'Failed to send via Thanks.io',
                });
                failCount++;
            }
        }

        // Track bulk order completion in PostHog
        await trackServerEvent(user.id, 'bulk_order_created', {
            productType: data.productType,
            totalRecipients: data.recipientIds.length,
            successCount,
            failCount,
            tier: usage.tier,
        });

        revalidatePath('/orders');
        revalidatePath('/dashboard');

        return {
            success: successCount > 0,
            results,
            summary: {
                total: data.recipientIds.length,
                successful: successCount,
                failed: failCount,
            },
        };

    } catch (error: any) {
        console.error('Failed to create bulk orders:', error);
        return { success: false, error: error.message || 'Failed to create bulk orders' };
    }
}

/**
 * Create bulk order from CSV data
 * Similar to createBulkOrder but accepts recipient data directly from CSV instead of IDs
 */
export async function createBulkOrderFromCSV(data: {
    recipients: Array<{
        name: string;
        address1: string;
        address2?: string;
        city: string;
        state: string;
        zip: string;
        country?: string;
        message: string;
    }>;
    productType: ProductType;
    handwritingStyle: string;
    handwritingColor: string;
}) {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        if (data.recipients.length === 0) {
            return { success: false, error: 'No recipients provided' };
        }

        // Get or create usage record
        let usage = await prisma.userUsage.findUnique({
            where: { userId: user.id },
        });

        if (!usage) {
            const now = new Date();
            const resetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            usage = await prisma.userUsage.create({
                data: { userId: user.id, tier: 'FREE', resetAt },
            });
        }

        const results = [];
        let successCount = 0;
        let failCount = 0;

        for (const recipient of data.recipients) {
            // Validate recipient address before sending
            const validationResult = await validateAddress({
                address1: recipient.address1,
                address2: recipient.address2,
                city: recipient.city,
                state: recipient.state,
                zip: recipient.zip,
                country: recipient.country || 'US',
            });

            if (!validationResult.isValid || validationResult.deliverable === false) {
                const errorMessage = validationResult.messages?.[0] || 'Invalid address';
                results.push({
                    recipientName: recipient.name,
                    success: false,
                    error: `Address validation failed: ${errorMessage}`,
                });
                failCount++;
                continue;
            }

            // Re-fetch usage for each iteration to get updated counts
            const currentUsage = await prisma.userUsage.findUnique({
                where: { userId: user.id },
            });

            if (!currentUsage || !canGenerate(currentUsage, 'letter')) {
                // Track limit reached event
                await trackServerEvent(user.id, 'limit_reached', {
                    type: 'csv_bulk_order_creation',
                    tier: currentUsage?.tier || 'FREE',
                    successCount,
                    failCount: failCount + 1,
                });

                results.push({
                    recipientName: recipient.name,
                    success: false,
                    error: 'Monthly sending limit reached',
                });
                failCount++;
                continue;
            }

            // Create a temporary recipient record (or find existing by address)
            // This allows us to track orders properly
            let recipientRecord = await prisma.recipient.findFirst({
                where: {
                    userId: user.id,
                    name: recipient.name,
                    address1: recipient.address1,
                    city: recipient.city,
                    state: recipient.state,
                    zip: recipient.zip,
                },
            });

            if (!recipientRecord) {
                recipientRecord = await prisma.recipient.create({
                    data: {
                        userId: user.id,
                        name: recipient.name,
                        address1: recipient.address1,
                        address2: recipient.address2,
                        city: recipient.city,
                        state: recipient.state,
                        zip: recipient.zip,
                        country: recipient.country || 'US',
                    },
                });
            }

            // Create order record first (pending status)
            const order = await prisma.order.create({
                data: {
                    userId: user.id,
                    recipientId: recipientRecord.id,
                    templateId: null,
                    status: 'pending',
                },
            });

            // Format recipient for Thanks.io
            const thanksRecipient = {
                name: recipient.name,
                address: recipient.address1,
                address2: recipient.address2 || undefined,
                city: recipient.city,
                province: recipient.state,
                postal_code: recipient.zip,
                country: recipient.country || 'US',
            };

            try {
                // Send via Thanks.io based on product type
                let response;
                const params = {
                    recipients: [thanksRecipient],
                    message: recipient.message,
                    handwriting_style: data.handwritingStyle || '1',
                    handwriting_color: data.handwritingColor || 'blue',
                };

                switch (data.productType) {
                    case 'postcard':
                        response = await sendPostcard(params);
                        break;
                    case 'letter':
                        response = await sendLetter(params);
                        break;
                    case 'greeting':
                        response = await sendGreetingCard(params);
                        break;
                    default:
                        throw new Error('Invalid product type');
                }

                // Update order with Thanks.io ID and status
                await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        status: response.status || 'queued',
                    },
                });

                // Create MailOrder record to track Thanks.io order
                await prisma.mailOrder.create({
                    data: {
                        orderId: order.id,
                        thanksIoOrderId: response.id.toString(),
                        status: response.status || 'queued',
                        recipientName: recipient.name,
                        recipientAddress: `${recipient.address1}, ${recipient.city}, ${recipient.state} ${recipient.zip}`,
                    },
                });

                // Increment usage counter
                await prisma.userUsage.update({
                    where: { userId: user.id },
                    data: { lettersSent: { increment: 1 } },
                });

                // Track unified event
                const person = await findPersonByIdentity('user', user.id);
                if (person) {
                    await trackAppEvent({
                        eventType: 'letter_sent',
                        personId: person.id,
                        properties: {
                            productType: data.productType,
                            source: 'csv_bulk_upload',
                            recipientName: recipient.name,
                            orderId: order.id,
                            thanksIoId: response.id.toString(),
                        },
                    });
                }

                // Track in PostHog
                await trackServerEvent(user.id, 'letter_sent', {
                    productType: data.productType,
                    recipientName: recipient.name,
                    source: 'csv_bulk_upload',
                });

                // Re-check current usage to see if this is their first or subsequent send
                const updatedUsage = await prisma.userUsage.findUnique({
                    where: { userId: user.id },
                });
                const totalSent = updatedUsage?.lettersSent || 0;
                if (totalSent > 1) {
                    await trackServerEvent(user.id, 'letter_returning_user', {});
                }

                results.push({
                    recipientName: recipient.name,
                    success: true,
                    orderId: order.id,
                    thanksIoId: response.id,
                    status: response.status,
                });
                successCount++;

            } catch (sendError: any) {
                // Mark order as failed
                await prisma.order.update({
                    where: { id: order.id },
                    data: { status: 'failed' },
                });

                console.error('Thanks.io send error:', sendError);
                results.push({
                    recipientName: recipient.name,
                    success: false,
                    error: sendError.message || 'Failed to send via Thanks.io',
                });
                failCount++;
            }
        }

        // Track bulk order completion in PostHog
        await trackServerEvent(user.id, 'csv_bulk_order_created', {
            productType: data.productType,
            totalRecipients: data.recipients.length,
            successCount,
            failCount,
            tier: usage.tier,
        });

        revalidatePath('/orders');
        revalidatePath('/dashboard');

        return {
            success: successCount > 0,
            results,
            summary: {
                total: data.recipients.length,
                successful: successCount,
                failed: failCount,
            },
        };

    } catch (error: any) {
        console.error('Failed to create bulk orders from CSV:', error);
        return { success: false, error: error.message || 'Failed to create bulk orders from CSV' };
    }
}
