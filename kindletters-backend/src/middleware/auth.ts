import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

/**
 * Express middleware to authenticate requests using Supabase
 * Adds user to req.user if authenticated, otherwise returns 401
 */
export async function authenticateRequest(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        // Get auth token from Authorization header or cookies
        const authHeader = req.headers.authorization;
        const token = authHeader?.replace('Bearer ', '') || req.cookies?.['sb-access-token'];
        
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            console.error('Missing Supabase environment variables');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

        // If token provided, verify it
        if (token) {
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (user && !error) {
                (req as any).user = user;
                return next();
            }
        }

        // Try to get user from cookies (for browser requests)
        const cookieHeader = req.headers.cookie;
        if (cookieHeader) {
            // Parse cookies manually or use cookie-parser
            const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
                const [key, value] = cookie.trim().split('=');
                acc[key] = value;
                return acc;
            }, {} as Record<string, string>);

            // Try to get session from Supabase using cookies
            // This is a simplified approach - in production, you'd want to properly parse Supabase cookies
            const accessToken = cookies['sb-access-token'] || cookies['sb-auth-token'];
            if (accessToken) {
                const { data: { user }, error } = await supabase.auth.getUser(accessToken);
                if (user && !error) {
                    (req as any).user = user;
                    return next();
                }
            }
        }

        // No valid authentication found
        return res.status(401).json({ error: 'Unauthorized. Please sign in.' });
    } catch (error: any) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({ error: 'Authentication error' });
    }
}

/**
 * Optional authentication - adds user to req.user if authenticated, but doesn't fail if not
 */
export async function optionalAuth(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.replace('Bearer ', '') || req.cookies?.['sb-access-token'];
        
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            return next(); // Continue without auth
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

        if (token) {
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (user && !error) {
                (req as any).user = user;
            }
        }

        next();
    } catch (error) {
        // Continue without auth on error
        next();
    }
}

