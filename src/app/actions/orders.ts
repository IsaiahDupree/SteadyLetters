'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { sendPostcard, sendLetter, sendGreetingCard, ProductType } from '@/lib/thanks-io';
import { canGenerate } from '@/lib/tiers';
import { trackServerEvent } from '@/lib/posthog-server';

async function getCurrentUser() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: any) {
                    cookieStore.set(name, value, options);
                },
                remove(name: string, options: any) {
                    cookieStore.delete(name);
                },
            },
        }
    );
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        throw new Error('Unauthorized. Please sign in.');
    }
    
    return user;
}

export async function createOrder(data: {
    recipientId: string;
    templateId?: string;
    message: string;
    productType: ProductType;
    frontImageUrl?: string;
    handwritingStyle?: string;
    handwritingColor?: string;
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

        // Create order record first (pending status)
        const order = await prisma.order.create({
            data: {
                userId: user.id,
                recipientId: data.recipientId,
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

            // Track order creation in PostHog
            await trackServerEvent(user.id, 'order_created', {
                productType: data.productType,
                orderId: order.id,
                thanksIoId: response.id,
                tier: usage.tier,
            });

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

function getNextResetDate(): Date {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth;
}
