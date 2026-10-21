import { Router, Request, Response } from 'express';
import { stripe } from '../../lib/stripe';
import { prisma } from '../../lib/prisma';
import { authenticateRequest } from '../../middleware/auth';

const router = Router();

/**
 * GET /api/stripe/portal
 * Create a Stripe Customer Portal session
 */
router.get('/', authenticateRequest, async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;

        if (!user) {
            return res.status(401).json({
                error: 'Unauthorized'
            });
        }

        // Ensure user exists in Prisma
        const dbUser = await prisma.user.upsert({
            where: { id: user.id },
            update: {},
            create: {
                id: user.id,
                email: user.email || '',
            },
            select: { stripeCustomerId: true },
        });

        if (!dbUser.stripeCustomerId) {
            return res.status(404).json({
                error: 'No subscription found. Please subscribe to a plan first.'
            });
        }

        // Create Stripe Customer Portal session
        const session = await stripe.billingPortal.sessions.create({
            customer: dbUser.stripeCustomerId,
            return_url: `${process.env.NEXT_PUBLIC_URL || 'https://www.steadyletters.com'}/billing`,
        });

        return res.json({ url: session.url });
    } catch (error: any) {
        console.error('Portal session error:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            name: error.name,
        });
        
        const errorMessage = process.env.NODE_ENV === 'development'
            ? error.message || 'Failed to create portal session'
            : 'Failed to create portal session';
        
        return res.status(500).json({
            error: errorMessage,
            ...(process.env.NODE_ENV === 'development' && { 
                details: error.message,
            })
        });
    }
});

export default router;

