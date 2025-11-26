import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
    try {
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'kindletters-backend',
            environment: process.env.NODE_ENV || 'development',
        });
    } catch (error: any) {
        console.error('Health check error:', error);
        res.status(500).json({
            status: 'error',
            error: error.message || 'Health check failed',
            timestamp: new Date().toISOString(),
        });
    }
});

export default router;
