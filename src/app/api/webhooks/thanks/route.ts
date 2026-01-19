import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        
        // Extract order info from Thanks.io webhook
        const { order_id, status, event_type } = body;
        
        if (!order_id) {
            return NextResponse.json(
                { error: 'Missing order_id' }, 
                { status: 400 }
            );
        }
        
        const newStatus = status || event_type || 'unknown';
        
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
        
        return NextResponse.json({ 
            received: true,
            ordersUpdated: updatedOrders.count,
            mailOrdersUpdated: updatedMailOrders.count,
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
