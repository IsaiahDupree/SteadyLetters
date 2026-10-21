import { Router, Request, Response } from 'express';
import { getHandwritingStyles } from '../../lib/thanks-io';
import { prisma } from '../../lib/prisma';
import { authenticateRequest } from '../../middleware/auth';

const router = Router();

/**
 * GET /api/thanks-io/styles
 * Get handwriting styles from Thanks.io API
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
        await prisma.user.upsert({
            where: { id: user.id },
            update: {},
            create: {
                id: user.id,
                email: user.email || '',
            },
        });

        // Fetch handwriting styles from Thanks.io API
        const styles = await getHandwritingStyles();

        return res.json({
            styles,
        });
    } catch (error: any) {
        console.error('Error fetching handwriting styles:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            name: error.name,
        });
        
        // Return default styles on error
        return res.json({
            styles: [
                { id: 'cursive', name: 'Cursive' },
                { id: 'print', name: 'Print' },
                { id: 'script', name: 'Script' },
            ],
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
});

export default router;

