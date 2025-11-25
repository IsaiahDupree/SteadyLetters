import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/api-auth';

/**
 * GET /api/orders
 * Fetch orders for authenticated user
 */
export async function GET(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser(request);

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized. Please sign in to view orders.' },
                { status: 401 }
            );
        }

        // Get all orders for this user
        const orders = await prisma.order.findMany({
            where: { userId: user.id },
            include: {
                recipient: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json({ orders }, { status: 200 });
    } catch (error: any) {
        console.error('Get orders error:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            name: error.name,
        });
        
        // Ensure user exists in Prisma if auth succeeded but DB query failed
        try {
            const authUser = await getAuthenticatedUser(request);
            if (authUser) {
                await prisma.user.upsert({
                    where: { id: authUser.id },
                    update: {},
                    create: {
                        id: authUser.id,
                        email: authUser.email || '',
                    },
                });
            }
        } catch (upsertError) {
            console.error('Failed to upsert user:', upsertError);
        }
        
        const errorMessage = process.env.NODE_ENV === 'development'
            ? error.message || 'Failed to fetch orders'
            : 'Failed to fetch orders';
        
        return NextResponse.json(
            { 
                error: errorMessage,
                ...(process.env.NODE_ENV === 'development' && { 
                    details: error.message,
                })
            },
            { status: 500 }
        );
    }
}

/**
 * POST /api/orders
 * Create a new order for authenticated user
 */
export async function POST(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser(request);

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized. Please sign in to create  orders.' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { recipientId, templateId, status = 'draft' } = body;

        if (!recipientId) {
            return NextResponse.json(
                { error: 'Missing required field: recipientId' },
                { status: 400 }
            );
        }

        // Verify recipient belongs to user
        const recipient = await prisma.recipient.findUnique({
            where: { id: recipientId },
        });

        if (!recipient || recipient.userId !== user.id) {
            return NextResponse.json(
                { error: 'Recipient not found or does not belong to user' },
                { status: 404 }
            );
        }

        // If templateId provided, verify it belongs to user
        if (templateId) {
            const template = await prisma.template.findUnique({
                where: { id: templateId },
            });

            if (!template || template.userId !== user.id) {
                return NextResponse.json(
                    { error: 'Template not found or does not belong to user' },
                    { status: 404 }
                );
            }
        }

        // Create order (content is stored in template, linked via templateId)
        const order = await prisma.order.create({
            data: {
                userId: user.id,
                recipientId,
                templateId: templateId || null,
                status,
            },
            include: {
                recipient: true,
                template: true,
            },
        });

        return NextResponse.json({ order }, { status: 201 });
    } catch (error) {
        console.error('Create order error:', error);
        return NextResponse.json(
            { error: 'Failed to create order' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/orders
 * Update order status
 */
export async function PATCH(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser(request);

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { orderId, status } = body;

        if (!orderId || !status) {
            return NextResponse.json(
                { error: 'Missing required fields: orderId, status' },
                { status: 400 }
            );
        }

        // Valid statuses
        const validStatuses = ['draft', 'pending', 'sent', 'delivered', 'failed'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
                { status: 400 }
            );
        }

        // Verify order belongs to user
        const existingOrder = await prisma.order.findUnique({
            where: { id: orderId },
        });

        if (!existingOrder || existingOrder.userId !== user.id) {
            return NextResponse.json(
                { error: 'Order not found or does not belong to user' },
                { status: 404 }
            );
        }

        // Update order status
        const order = await prisma.order.update({
            where: { id: orderId },
            data: {
                status,
                ...(status === 'sent' && { sentAt: new Date() }),
                ...(status === 'delivered' && { deliveredAt: new Date() }),
            },
            include: {
                recipient: true,
            },
        });

        return NextResponse.json({ order }, { status: 200 });
    } catch (error) {
        console.error('Update order error:', error);
        return NextResponse.json(
            { error: 'Failed to update order' },
            { status: 500 }
        );
    }
}
