"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const openai_1 = require("../lib/openai");
const prisma_1 = require("../lib/prisma");
const tiers_1 = require("../lib/tiers");
const events_1 = require("../lib/events");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 20 * 1024 * 1024, // 20MB max for Vision API
    },
});
/**
 * POST /api/analyze-image
 * Analyze an image using GPT-4 Vision
 */
router.post('/', auth_1.authenticateRequest, upload.single('image'), async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                error: 'Unauthorized. Please sign in to use this feature.'
            });
        }
        const imageFile = req.file;
        if (!imageFile) {
            return res.status(400).json({
                error: 'No image file provided'
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
        // Check if user can analyze images
        // For now, we'll use image generation limits
        // TODO: Add separate imageAnalyses limit
        if (!(0, tiers_1.canGenerate)(usage, 'image')) {
            await (0, events_1.trackEvent)({
                userId,
                eventType: 'limit_reached',
                metadata: { type: 'image_analysis', tier: usage.tier },
            });
            return res.status(403).json({
                error: 'You have reached your image analysis limit. Please upgrade your plan.'
            });
        }
        // Convert image buffer to base64 for Vision API
        const base64Image = imageFile.buffer.toString('base64');
        const imageUrl = `data:${imageFile.mimetype};base64,${base64Image}`;
        // Analyze image using GPT-4 Vision
        const response = await openai_1.openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: 'Describe this image in detail. Include colors, mood, objects, people, settings, and any text visible. Focus on elements that would be suitable for creating a personalized greeting card design. Be concise but descriptive (2-3 sentences).',
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: imageUrl,
                            },
                        },
                    ],
                },
            ],
            max_tokens: 300,
        });
        const analysis = response.choices[0].message.content || '';
        // Increment usage counter
        await prisma_1.prisma.userUsage.update({
            where: { userId },
            data: {
                imageAnalyses: { increment: 1 },
            },
        });
        // Track event
        await (0, events_1.trackEvent)({
            userId,
            eventType: 'image_analyzed',
            metadata: {
                fileSize: imageFile.size,
                fileType: imageFile.mimetype,
                analysisLength: analysis.length,
            },
        });
        return res.json({
            analysis,
        });
    }
    catch (error) {
        console.error('Image analysis error:', error);
        // Provide more detailed error in development
        const errorMessage = process.env.NODE_ENV === 'development'
            ? error.message || 'Failed to analyze image'
            : 'Failed to analyze image. Please try again.';
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
