"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_js_1 = require("@supabase/supabase-js");
const prisma_1 = require("../../lib/prisma");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
/**
 * POST /api/auth/sync-user
 * Sync Supabase user to Prisma database
 * Uses optional auth since we need to get user from cookies
 */
router.post('/', auth_1.optionalAuth, async (req, res) => {
    try {
        // Validate environment variables
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            console.error('Missing Supabase environment variables');
            return res.status(500).json({
                error: 'Server configuration error'
            });
        }
        const supabase = (0, supabase_js_1.createClient)(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
        // Try to get user from request (set by optionalAuth middleware)
        let user = req.user;
        // If not set by middleware, try to get from cookies
        if (!user) {
            const cookies = req.cookies || {};
            const accessToken = cookies['sb-access-token'] || cookies['sb-auth-token'];
            if (accessToken) {
                const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(accessToken);
                if (supabaseUser && !error) {
                    user = supabaseUser;
                }
            }
        }
        // If still no user, try Authorization header
        if (!user) {
            const authHeader = req.headers.authorization;
            const token = authHeader?.replace('Bearer ', '');
            if (token) {
                const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);
                if (supabaseUser && !error) {
                    user = supabaseUser;
                }
            }
        }
        if (!user) {
            return res.status(401).json({
                error: 'Not authenticated'
            });
        }
        // Check if user exists in Prisma
        const existingUser = await prisma_1.prisma.user.findUnique({
            where: { id: user.id },
        });
        if (!existingUser) {
            // Create user in Prisma (use upsert to handle race conditions)
            await prisma_1.prisma.user.upsert({
                where: { id: user.id },
                update: {},
                create: {
                    id: user.id,
                    email: user.email,
                },
            });
            // Create initial UserUsage record (use upsert to handle race conditions)
            const now = new Date();
            const resetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            await prisma_1.prisma.userUsage.upsert({
                where: { userId: user.id },
                update: {},
                create: {
                    userId: user.id,
                    tier: 'FREE',
                    resetAt,
                },
            });
        }
        return res.json({ success: true });
    }
    catch (error) {
        console.error('Sync user error:', error);
        // Provide more detailed error in development
        const errorMessage = process.env.NODE_ENV === 'development'
            ? error.message || 'Failed to sync user'
            : 'Failed to sync user. Please try again.';
        return res.status(500).json({
            error: errorMessage,
            ...(process.env.NODE_ENV === 'development' && {
                details: error.stack,
                type: error.constructor?.name,
                code: error.code,
            })
        });
    }
});
exports.default = router;
