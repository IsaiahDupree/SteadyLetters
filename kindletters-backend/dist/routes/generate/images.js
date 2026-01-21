"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const openai_1 = require("../../lib/openai");
const prisma_1 = require("../../lib/prisma");
const tiers_1 = require("../../lib/tiers");
const events_1 = require("../../lib/events");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
/**
 * POST /api/generate/images
 * Generate 4 card images using DALL-E 3
 */
router.post('/', auth_1.authenticateRequest, async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                error: 'Unauthorized. Please sign in to generate images.'
            });
        }
        const { occasion, tone, holiday, imageAnalysis } = req.body;
        if (!occasion || !tone) {
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
        // Check if user can generate images (need 4 credits for 4 images)
        const canGenerateImages = (0, tiers_1.canGenerate)(usage, 'image');
        if (!canGenerateImages) {
            await (0, events_1.trackEvent)({
                userId,
                eventType: 'limit_reached',
                metadata: { type: 'image_generation', tier: usage.tier },
            });
            return res.status(403).json({
                error: 'You have reached your image generation limit. Please upgrade your plan.'
            });
        }
        // Generate 4 images using DALL-E 3
        const imagePromises = Array.from({ length: 4 }, (_, i) => (0, openai_1.generateCardImage)({ occasion, tone, holiday, imageAnalysis }).catch(error => {
            console.error(`Failed to generate image ${i + 1}:`, error);
            return null;
        }));
        const images = await Promise.all(imagePromises);
        // Filter out failed generations
        const validImages = images.filter((url) => url !== null);
        if (validImages.length === 0) {
            return res.status(500).json({
                error: 'Failed to generate images. Please try again.'
            });
        }
        // Increment usage counter by the number of images generated
        await prisma_1.prisma.userUsage.update({
            where: { userId },
            data: {
                imageGenerations: { increment: validImages.length },
            },
        });
        // Track event for each image generated
        for (let i = 0; i < validImages.length; i++) {
            await (0, events_1.trackEvent)({
                userId,
                eventType: 'image_generated',
                metadata: {
                    occasion,
                    tone,
                    tier: usage.tier,
                },
            });
        }
        return res.json({ images: validImages });
    }
    catch (error) {
        console.error('Failed to generate images:', error);
        // Provide more detailed error in development
        const errorMessage = process.env.NODE_ENV === 'development'
            ? error.message || 'Failed to generate images'
            : 'Failed to generate images. Please try again.';
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
