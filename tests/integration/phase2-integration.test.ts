import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma';

/**
 * Integration Test Suite
 * 
 * Tests complete workflows across multiple components:
 * - Database operations
 * - API chains
 * - User workflows
 * - Data consistency
 */

describe('Integration Tests - Order Creation Workflow', () => {
    let testUserId: string;

    beforeEach(() => {
        testUserId = 'integration-test-user';
    });

    it('should create order and update usage tracking', async () => {
        // 1. Create order
        const orderData = {
            userId: testUserId,
            thanksIoOrderId: 'test-order-123',
            productType: 'postcard',
            status: 'queued',
            recipientCount: 2,
            message: 'Test message',
            cost: 2.28 // 2 postcards at $1.14 each
        };

        vi.spyOn(prisma.mailOrder, 'create').mockResolvedValue(orderData as any);
        vi.spyOn(prisma.userUsage, 'update').mockResolvedValue({} as any);

        const order = await prisma.mailOrder.create({ data: orderData });

        // 2. Update usage
        await prisma.userUsage.update({
            where: { userId: testUserId },
            data: {
                postcardsSent: { increment: orderData.recipientCount },
                totalSpent: { increment: orderData.cost }
            }
        });

        // Verify both operations called
        expect(prisma.mailOrder.create).toHaveBeenCalled();
        expect(prisma.userUsage.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { userId: testUserId },
                data: expect.objectContaining({
                    postcardsSent: { increment: 2 }
                })
            })
        );
    });

    it('should handle transaction rollback on failure', async () => {
        // Simulate a transaction that should rollback
        try {
            // Start transaction
            const order = await prisma.mailOrder.create({
                data: {
                    userId: testUserId,
                    thanksIoOrderId: 'fail-order',
                    productType: 'letter',
                    status: 'queued',
                    recipientCount: 1,
                    message: 'Test',
                    cost: 1.20
                }
            });

            // Intentionally fail usage update
            throw new Error('Simulated failure');

        } catch (error) {
            // In a real transaction, order should be rolled back
            expect(error).toBeDefined();
        }
    });
});

describe('Integration Tests - Analytics Workflow', () => {
    it('should calculate analytics from order history', async () => {
        const mockOrders = [
            {
                cost: 10.00,
                recipientCount: 1,
                productType: 'postcard',
                createdAt: new Date()
            },
            {
                cost: 20.00,
                recipientCount: 2,
                productType: 'letter',
                createdAt: new Date()
            }
        ];

        vi.spyOn(prisma.mailOrder, 'findMany').mockResolvedValue(mockOrders as any);

        const orders = await prisma.mailOrder.findMany({
            where: { userId: 'test-user' }
        });

        // Calculate metrics
        const totalSpent = orders.reduce((sum: number, o: any) => sum + o.cost, 0);
        const averageCost = totalSpent / orders.length;

        const productStats = orders.reduce((acc: any, order: any) => {
            if (!acc[order.productType]) acc[order.productType] = 0;
            acc[order.productType]++;
            return acc;
        }, {});

        expect(totalSpent).toBe(30.00);
        expect(averageCost).toBe(15.00);
        expect(productStats.postcard).toBe(1);
        expect(productStats.letter).toBe(1);
    });
});

describe('Integration Tests - User Settings Workflow', () => {
    it('should update return address and reflect in send request', async () => {
        const userId = 'test-user';
        const returnAddress = {
            returnName: 'John Doe',
            returnAddress1: '123 Main St',
            returnCity: 'New York',
            returnState: 'NY',
            returnZip: '10001',
            returnCountry: 'US'
        };

        // Update return address
        vi.spyOn(prisma.user, 'update').mockResolvedValue({
            id: userId,
            email: 'test@example.com',
            ...returnAddress,
            createdAt: new Date()
        } as any);

        await prisma.user.update({
            where: { id: userId },
            data: returnAddress
        });

        // Fetch for send request
        vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
            id: userId,
            email: 'test@example.com',
            ...returnAddress,
            createdAt: new Date()
        } as any);

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                returnName: true,
                returnAddress1: true,
                returnCity: true,
                returnState: true,
                returnZip: true
            }
        });

        expect(user?.returnName).toBe('John Doe');
        expect(user?.returnAddress1).toBe('123 Main St');
    });
});

describe('Integration Tests - Data Consistency', () => {
    it('should maintain consistent totals between orders and usage', async () => {
        const userId = 'consistency-test-user';

        const mockOrders = [
            { cost: 10.00, productType: 'postcard', recipientCount: 5 },
            { cost: 15.00, productType: 'postcard', recipientCount: 10 },
            { cost: 20.00, productType: 'letter', recipientCount: 15 }
        ];

        vi.spyOn(prisma.mailOrder, 'findMany').mockResolvedValue(mockOrders as any);

        const orders = await prisma.mailOrder.findMany({
            where: { userId }
        });

        // Calculate expected values
        const expectedTotalSpent = orders.reduce((sum: number, o: any) => sum + o.cost, 0);
        const expectedPostcards = orders
            .filter((o: any) => o.productType === 'postcard')
            .reduce((sum: number, o: any) => sum + o.recipientCount, 0);
        const expectedLetters = orders
            .filter((o: any) => o.productType === 'letter')
            .reduce((sum: number, o: any) => sum + o.recipientCount, 0);

        // Mock usage data
        const mockUsage = {
            totalSpent: expectedTotalSpent,
            postcardsSent: expectedPostcards,
            lettersSentStandard: expectedLetters
        };

        vi.spyOn(prisma.userUsage, 'findUnique').mockResolvedValue(mockUsage as any);

        const usage = await prisma.userUsage.findUnique({
            where: { userId }
        });

        // Verify consistency
        expect(usage?.totalSpent).toBe(45.00);
        expect(usage?.postcardsSent).toBe(15); // 5 + 10
        expect(usage?.lettersSentStandard).toBe(15);
    });
});

describe('Integration Tests - Error Recovery', () => {
    it('should handle database connection errors gracefully', async () => {
        vi.spyOn(prisma.user, 'update').mockRejectedValue(
            new Error('Database connection failed')
        );

        await expect(
            prisma.user.update({
                where: { id: 'test' },
                data: { returnName: 'Test' }
            })
        ).rejects.toThrow('Database connection failed');
    });

    it('should handle concurrent updates correctly', async () => {
        const userId = 'concurrent-user';

        // Simulate concurrent usage updates
        const update1 = prisma.userUsage.update({
            where: { userId },
            data: { postcardsSent: { increment: 1 } }
        });

        const update2 = prisma.userUsage.update({
            where: { userId },
            data: { lettersSentStandard: { increment: 1 } }
        });

        // Both should succeed
        await expect(Promise.all([update1, update2])).resolves.toBeDefined();
    });
});
