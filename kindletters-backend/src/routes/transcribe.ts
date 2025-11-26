import { Router, Request, Response } from 'express';
import multer from 'multer';
import { openai } from '../lib/openai';
import { prisma } from '../lib/prisma';
import { canGenerate } from '../lib/tiers';
import { trackEvent } from '../lib/events';
import { authenticateRequest } from '../middleware/auth';

const router = Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 25 * 1024 * 1024, // 25MB max for Whisper
    },
});

router.post('/', authenticateRequest, upload.single('audio'), async (req: Request, res: Response) => {
    try {
        // Get authenticated user (from middleware)
        const user = (req as any).user;

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
        await prisma.user.upsert({
            where: { id: userId },
            update: {},
            create: {
                id: userId,
                email: user.email!,
            },
        });

        // Get or create user usage record
        let usage = await prisma.userUsage.findUnique({
            where: { userId },
        });

        if (!usage) {
            // Calculate next month's 1st day for resetAt
            const now = new Date();
            const resetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            usage = await prisma.userUsage.create({
                data: { userId, tier: 'FREE', resetAt },
            });
        }

        // Check if user can transcribe (using tier limits)
        // For now, we'll use letter generation limits
        // TODO: Add separate voiceTranscriptions limit
        if (!canGenerate(usage, 'letter')) {
            await trackEvent({
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
        const file = new File(
            [audioFile.buffer],
            audioFile.originalname || 'audio.webm',
            { type: audioFile.mimetype || 'audio/webm' }
        );

        // Transcribe audio using Whisper
        // OpenAI SDK accepts File objects in Node.js 18+
        const transcription = await openai.audio.transcriptions.create({
            file: file,
            model: 'whisper-1',
            language: 'en',
            response_format: 'json',
        });

        // Increment usage counter
        await prisma.userUsage.update({
            where: { userId },
            data: {
                voiceTranscriptions: { increment: 1 },
            },
        });

        // Track event
        await trackEvent({
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
    } catch (error: any) {
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

export default router;

