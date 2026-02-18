import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyThanksSignature } from '@/lib/webhook-verification.js';
import { sendOrderStatusEmail } from '@/lib/email.js';
import { findPersonByIdentity } from '@/lib/identity.js';

export async function POST(request: NextRequest) {
    try {
        // Get raw body for signature verification
        const body = await request.text();
        const signature = request.headers.get('x-thanks-signature');

        // Verify webhook signature
        if (!verifyThanksSignature(body, signature, process.env.THANKS_IO_WEBHOOK_SECRET)) {
            console.warn('[Thanks.io Webhook] Invalid signature rejected');
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 401 }
            );
        }

        // Parse the verified body
        const payload = JSON.parse(body);

        // Thanks.io webhook format (from docs):
        // { event_type: "order.status_update", event_id: "...", data: { "order.id": 42401, "order.status": "Printing" }, timestamp: ... }
        // { event_type: "order_item.delivered", data: { "order_item.id": ..., "order.id": ..., "order_item.current_status": "Delivered", "recipient.name": ... } }
        const eventType = payload.event_type;
        const eventData = payload.data || {};

        // Extract order ID — Thanks.io uses dot-notation keys in the data object
        const order_id = String(eventData['order.id'] || eventData.order_id || '');
        
        if (!order_id) {
            return NextResponse.json(
                { error: 'Missing order.id in webhook payload' }, 
                { status: 400 }
            );
        }

        // Determine new status based on event type
        let newStatus: string;
        if (eventType === 'order.status_update') {
            newStatus = eventData['order.status'] || 'unknown';
        } else if (eventType === 'order_item.delivered') {
            newStatus = eventData['order_item.current_status'] || 'Delivered';
        } else if (eventType === 'order_item.status_change') {
            newStatus = eventData['order_item.current_status'] || 'unknown';
        } else {
            newStatus = eventData['order.status'] || eventData.status || 'unknown';
        }

        console.log(`[Thanks.io Webhook] Event: ${eventType}, Order: ${order_id}, Status: ${newStatus}`);

        // Update Order records matching this Thanks.io order ID
        const updatedOrders = await prisma.order.updateMany({
            where: { thanksIoOrderId: order_id },
            data: { status: newStatus },
        });

        // Also update MailOrder if it exists
        const updatedMailOrders = await prisma.mailOrder.updateMany({
            where: { thanksIoOrderId: order_id },
            data: { status: newStatus },
        });

        console.log(`[Thanks.io Webhook] Updated ${updatedOrders.count} orders, ${updatedMailOrders.count} mail orders for ${order_id} to status: ${newStatus}`);

        // Send email notifications to users for each updated order
        let emailsSent = 0;

        // Handle Order model notifications
        if (updatedOrders.count > 0) {
            const orders = await prisma.order.findMany({
                where: { thanksIoOrderId: order_id },
                include: {
                    user: true,
                    recipient: true,
                },
            });

            for (const order of orders) {
                try {
                    // Find person by user ID for tracking
                    const person = await findPersonByIdentity('user', order.userId);

                    const sent = await sendOrderStatusEmail(
                        order.user.email,
                        order.user.email.split('@')[0], // Extract name from email (fallback)
                        newStatus,
                        {
                            orderId: order.id,
                            thanksIoOrderId: order_id,
                            productType: 'Letter', // Default for Order model
                            recipientName: order.recipient.name,
                            recipientAddress: `${order.recipient.address1}, ${order.recipient.city}, ${order.recipient.state} ${order.recipient.zip}`,
                            personId: person?.id,
                        }
                    );

                    if (sent) {
                        emailsSent++;
                    }
                } catch (error) {
                    console.error('[Thanks.io Webhook] Email send error:', error);
                    // Continue processing other orders even if one email fails
                }
            }
        }

        // Handle MailOrder model notifications
        if (updatedMailOrders.count > 0) {
            const mailOrders = await prisma.mailOrder.findMany({
                where: { thanksIoOrderId: order_id },
                include: {
                    user: true,
                },
            });

            for (const mailOrder of mailOrders) {
                try {
                    // Find person by user ID for tracking
                    const person = await findPersonByIdentity('user', mailOrder.userId);

                    const sent = await sendOrderStatusEmail(
                        mailOrder.user.email,
                        mailOrder.user.email.split('@')[0], // Extract name from email (fallback)
                        newStatus,
                        {
                            orderId: mailOrder.id,
                            thanksIoOrderId: order_id,
                            productType: mailOrder.productType,
                            recipientName: `${mailOrder.recipientCount} recipient(s)`,
                            recipientAddress: 'Multiple addresses',
                            personId: person?.id,
                        }
                    );

                    if (sent) {
                        emailsSent++;
                    }
                } catch (error) {
                    console.error('[Thanks.io Webhook] Email send error:', error);
                    // Continue processing other orders even if one email fails
                }
            }
        }

        console.log(`[Thanks.io Webhook] Sent ${emailsSent} email notification(s)`);

        return NextResponse.json({
            received: true,
            ordersUpdated: updatedOrders.count,
            mailOrdersUpdated: updatedMailOrders.count,
            emailsSent,
        });
        
    } catch (error) {
        console.error('[Thanks.io Webhook] Error:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed' }, 
            { status: 500 }
        );
    }
}

// Also handle GET for webhook verification if needed
export async function GET() {
    return NextResponse.json({ status: 'Thanks.io webhook endpoint active' });
}
