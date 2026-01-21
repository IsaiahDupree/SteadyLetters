"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * GET /api/orders
 * Fetch orders for authenticated user
 */
router.get('/', auth_1.authenticateRequest, async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                error: 'Unauthorized. Please sign in to view orders.'
            });
        }
        // Get all orders for this user
        const orders = await prisma_1.prisma.order.findMany({
            where: { userId: user.id },
            include: {
                recipient: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return res.json({ orders });
    }
    catch (error) {
        console.error('Get orders error:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            name: error.name,
        });
        // Ensure user exists in Prisma if auth succeeded but DB query failed
        try {
            const user = req.user;
            if (user) {
                await prisma_1.prisma.user.upsert({
                    where: { id: user.id },
                    update: {},
                    create: {
                        id: user.id,
                        email: user.email || '',
                    },
                });
            }
        }
        catch (upsertError) {
            console.error('Failed to upsert user:', upsertError);
        }
        const errorMessage = process.env.NODE_ENV === 'development'
            ? error.message || 'Failed to fetch orders'
            : 'Failed to fetch orders';
        return res.status(500).json({
            error: errorMessage,
            ...(process.env.NODE_ENV === 'development' && {
                details: error.message,
            })
        });
    }
});
/**
 * POST /api/orders
 * Create a new order for authenticated user
 */
router.post('/', auth_1.authenticateRequest, async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                error: 'Unauthorized. Please sign in to create orders.'
            });
        }
        const { recipientId, templateId, status = 'draft' } = req.body;
        if (!recipientId) {
            return res.status(400).json({
                error: 'Missing required field: recipientId'
            });
        }
        // Verify recipient belongs to user
        const recipient = await prisma_1.prisma.recipient.findUnique({
            where: { id: recipientId },
        });
        if (!recipient || recipient.userId !== user.id) {
            return res.status(404).json({
                error: 'Recipient not found or does not belong to user'
            });
        }
        // If templateId provided, verify it belongs to user
        if (templateId) {
            const template = await prisma_1.prisma.template.findUnique({
                where: { id: templateId },
            });
            if (!template || template.userId !== user.id) {
                return res.status(404).json({
                    error: 'Template not found or does not belong to user'
                });
            }
        }
        // Create order (content is stored in template, linked via templateId)
        const order = await prisma_1.prisma.order.create({
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
        return res.status(201).json({ order });
    }
    catch (error) {
        console.error('Create order error:', error);
        return res.status(500).json({
            error: 'Failed to create order'
        });
    }
});
/**
 * PATCH /api/orders
 * Update order status
 */
router.patch('/', auth_1.authenticateRequest, async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                error: 'Unauthorized'
            });
        }
        const { orderId, status } = req.body;
        if (!orderId || !status) {
            return res.status(400).json({
                error: 'Missing required fields: orderId, status'
            });
        }
        // Valid statuses
        const validStatuses = ['draft', 'pending', 'sent', 'delivered', 'failed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }
        // Verify order belongs to user
        const existingOrder = await prisma_1.prisma.order.findUnique({
            where: { id: orderId },
        });
        if (!existingOrder || existingOrder.userId !== user.id) {
            return res.status(404).json({
                error: 'Order not found or does not belong to user'
            });
        }
        // Update order status
        const order = await prisma_1.prisma.order.update({
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
        return res.json({ order });
    }
    catch (error) {
        console.error('Update order error:', error);
        return res.status(500).json({
            error: 'Failed to update order'
        });
    }
});
exports.default = router;
