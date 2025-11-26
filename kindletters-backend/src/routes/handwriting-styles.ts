import { Router, Request, Response } from 'express';

// Thanks.io API endpoint for handwriting styles
const THANKS_IO_API = 'https://api.thanks.io/api/v2';

const router = Router();

/**
 * GET /api/handwriting-styles
 * Get available handwriting styles from Thanks.io API
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        // If API key is not configured, return default styles
        if (!process.env.THANKS_IO_API_KEY) {
            console.warn('THANKS_IO_API_KEY not configured, returning default styles');
            return res.json({
                styles: [
                    { id: 'cursive', name: 'Cursive' },
                    { id: 'print', name: 'Print' },
                    { id: 'script', name: 'Script' },
                ],
            });
        }

        const response = await fetch(`${THANKS_IO_API}/handwriting-styles`, {
            headers: {
                'Authorization': `Bearer ${process.env.THANKS_IO_API_KEY}`,
                'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        if (!response.ok) {
            throw new Error(`Thanks.io API returned ${response.status}: ${response.statusText}`);
        }

        const styles = await response.json();

        return res.json({ styles });
    } catch (error: any) {
        console.error('Handwriting styles error:', error);
        
        // Return default styles on error instead of failing
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

