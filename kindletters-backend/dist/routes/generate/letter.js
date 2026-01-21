"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const openai_1 = require("../../lib/openai");
const prisma_1 = require("../../lib/prisma");
const tiers_1 = require("../../lib/tiers");
const events_1 = require("../../lib/events");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
router.post('/', auth_1.authenticateRequest, async (req, res) => {
    try {
        // Get authenticated user (from middleware)
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                error: 'Unauthorized. Please sign in to generate letters.'
            });
        }
        const { context, tone, occasion, holiday, imageAnalysis, length } = req.body;
        if (!context || !tone || !occasion) {
            return res.status(400).json({
                error: 'Missing required fields'
            });
        }
        // Ensure user exists in Prisma
        const userId = user.id;
        await prisma_1.prisma.user.upsert({
            where: { id: userId },
            update: {},
            create: {
                id: userId,
                email: user.email,
            },
        });
        // Get or create user usage record
        let usage = await prisma_1.prisma.userUsage.findUnique({
            where: { userId },
        });
        if (!usage) {
            // Calculate next month's 1st day for resetAt
            const now = new Date();
            const resetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            usage = await prisma_1.prisma.userUsage.create({
                data: { userId, tier: 'FREE', resetAt },
            });
        }
        // Check if user can generate
        if (!(0, tiers_1.canGenerate)(usage, 'letter')) {
            // Track limit reached event
            await (0, events_1.trackEvent)({
                userId,
                eventType: 'limit_reached',
                metadata: { type: 'letter_generation', tier: usage.tier },
            });
            return res.status(403).json({
                error: 'You have reached your letter generation limit. Please upgrade your plan.'
            });
        }
        // Generate letter using OpenAI
        const letter = await (0, openai_1.generateLetterContent)({
            context,
            tone,
            occasion,
            holiday,
            imageAnalysis,
            length,
        });
        // Increment usage counter
        await prisma_1.prisma.userUsage.update({
            where: { userId },
            data: {
                letterGenerations: { increment: 1 },
            },
        });
        // Track successful generation
        await (0, events_1.trackEvent)({
            userId,
            eventType: 'letter_generated',
            metadata: { tone, occasion, holiday: holiday || null },
        });
        return res.json({ letter });
    }
    catch (error) {
        console.error('Failed to generate letter:', error);
        // Provide more detailed error in development
        const errorMessage = process.env.NODE_ENV === 'development'
            ? error.message || 'Failed to generate letter'
            : 'Failed to generate letter. Please try again.';
        return res.status(500).json({
            error: errorMessage,
            ...(process.env.NODE_ENV === 'development' && {
                details: error.stack,
                type: error.constructor?.name
            })
        });
    }
});
exports.default = router;
