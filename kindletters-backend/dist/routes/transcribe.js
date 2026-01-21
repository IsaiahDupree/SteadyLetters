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
        fileSize: 25 * 1024 * 1024, // 25MB max for Whisper
    },
});
router.post('/', auth_1.authenticateRequest, upload.single('audio'), async (req, res) => {
    try {
        // Get authenticated user (from middleware)
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                error: 'Unauthorized. Please sign in to use this feature.'
            });
        }
        const userId = user.id;
        const audioFile = req.file;
        if (!audioFile) {
            return res.status(400).json({
                error: 'No audio file provided'
            });
        }
        // Ensure user exists in Prisma
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
        // Check if user can transcribe (using tier limits)
        // For now, we'll use letter generation limits
        // TODO: Add separate voiceTranscriptions limit
        if (!(0, tiers_1.canGenerate)(usage, 'letter')) {
            await (0, events_1.trackEvent)({
                userId,
                eventType: 'limit_reached',
                metadata: { type: 'voice_transcription', tier: usage.tier },
            });
            return res.status(403).json({
                error: 'You have reached your transcription limit. Please upgrade your plan.'
            });
        }
        // Create a File object from the buffer for OpenAI
        // Node.js 18+ supports the File API globally
        const file = new File([audioFile.buffer], audioFile.originalname || 'audio.webm', { type: audioFile.mimetype || 'audio/webm' });
        // Transcribe audio using Whisper
        // OpenAI SDK accepts File objects in Node.js 18+
        const transcription = await openai_1.openai.audio.transcriptions.create({
            file: file,
            model: 'whisper-1',
            language: 'en',
            response_format: 'json',
        });
        // Increment usage counter
        await prisma_1.prisma.userUsage.update({
            where: { userId },
            data: {
                voiceTranscriptions: { increment: 1 },
            },
        });
        // Track event
        await (0, events_1.trackEvent)({
            userId,
            eventType: 'voice_transcribed',
            metadata: {
                duration: audioFile.size, // Approximate
                wordCount: transcription.text.split(' ').length,
            },
        });
        return res.json({
            text: transcription.text,
        });
    }
    catch (error) {
        console.error('Transcription error:', error);
        // Provide more detailed error in development
        const errorMessage = process.env.NODE_ENV === 'development'
            ? error.message || 'Failed to transcribe audio'
            : 'Failed to transcribe audio. Please try again.';
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
