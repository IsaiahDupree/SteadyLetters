"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const thanks_io_1 = require("../../lib/thanks-io");
const prisma_1 = require("../../lib/prisma");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
/**
 * GET /api/thanks-io/styles
 * Get handwriting styles from Thanks.io API
 */
router.get('/', auth_1.authenticateRequest, async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                error: 'Unauthorized'
            });
        }
        // Ensure user exists in Prisma
        await prisma_1.prisma.user.upsert({
            where: { id: user.id },
            update: {},
            create: {
                id: user.id,
                email: user.email || '',
            },
        });
        // Fetch handwriting styles from Thanks.io API
        const styles = await (0, thanks_io_1.getHandwritingStyles)();
        return res.json({
            styles,
        });
    }
    catch (error) {
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
exports.default = router;
