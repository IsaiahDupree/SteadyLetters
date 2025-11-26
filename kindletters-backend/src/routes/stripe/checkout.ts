import { Router, Request, Response } from 'express';
import { stripe, getOrCreateStripeCustomer } from '../../lib/stripe';
import { prisma } from '../../lib/prisma';
import { authenticateRequest } from '../../middleware/auth';

const router = Router();

/**
 * POST /api/stripe/checkout
 * Create a Stripe checkout session
 */
router.post('/', authenticateRequest, async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        
        if (!user) {
            return res.status(401).json({
                error: 'Unauthorized. Please sign in to purchase a plan.'
            });
        }

        const { priceId } = req.body;

        if (!priceId) {
            return res.status(400).json({
                error: 'Missing priceId'
            });
        }

        // Use upsert to handle race conditions
        await prisma.user.upsert({
            where: { id: user.id },
            update: {}, // No update needed if exists
            create: {
                id: user.id,
                email: user.email!,
            },
        });

        // Ensure UserUsage exists
        const now = new Date();
        const resetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        await prisma.userUsage.upsert({
            where: { userId: user.id },
            update: {}, // No update needed if exists
            create: {
                userId: user.id,
                tier: 'FREE',
                resetAt,
            },
        });

        // Get or create Stripe customer
        const customerId = await getOrCreateStripeCustomer(user.id, user.email!);

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/pricing?canceled=true`,
            metadata: {
                userId: user.id,
            },
        });

        return res.json({ url: session.url });
    } catch (error: any) {
        console.error('Checkout session error:', error);
        
        // Provide more detailed error information in development
        const errorMessage = process.env.NODE_ENV === 'development' 
            ? error.message || 'Failed to create checkout session'
            : 'Failed to create checkout session';
        
        return res.status(500).json({
            error: errorMessage,
            ...(process.env.NODE_ENV === 'development' && { details: error.stack })
        });
    }
});

export default router;

