import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { prisma } from '@/lib/prisma';
import { canGenerate } from '@/lib/tiers';
import { trackEvent } from '@/lib/events';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { trackServerEvent } from '@/lib/posthog-server';
import { ApiErrors, apiErrorFromException } from '@/lib/api-errors';

export async function POST(request: NextRequest) {
    try {
        // Check rate limit first
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous';
        const { success, remaining } = await checkRateLimit('transcription', ip);

        if (!success) {
            return ApiErrors.tooManyRequests();
        }

        // Get authenticated user
        const user = await getAuthenticatedUser(request);

        if (!user) {
            return ApiErrors.unauthorized('Unauthorized. Please sign in to use this feature.');
        }

        const userId = user.id;

        const formData = await request.formData();
        const audioFile = formData.get('audio') as File;

        if (!audioFile) {
            return ApiErrors.badRequest('No audio file provided');
        }

        // Check file size (25MB max for Whisper)
        if (audioFile.size > 25 * 1024 * 1024) {
            return ApiErrors.badRequest('Audio file too large. Maximum size is 25MB.');
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

            // Track in PostHog
            await trackServerEvent(userId, 'limit_reached', {
                type: 'voice_transcription',
                tier: usage.tier,
            });

            return ApiErrors.forbidden('You have reached your transcription limit. Please upgrade your plan.');
        }

        // Transcribe audio using Whisper
        const transcription = await openai.audio.transcriptions.create({
            file: audioFile,
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

        // Track in PostHog
        await trackServerEvent(userId, 'voice_transcribed', {
            fileSize: audioFile.size,
            wordCount: transcription.text.split(' ').length,
            tier: usage.tier,
        });

        return NextResponse.json({
            text: transcription.text,
        });
    } catch (error: any) {
        // Track failure in PostHog
        try {
            const user = await getAuthenticatedUser(request);
            if (user) {
                await trackServerEvent(user.id, 'voice_transcription_failed', {
                    error: error.message,
                });
            }
        } catch (trackError) {
            // Silently fail tracking
            console.error('Failed to track error event:', trackError);
        }

        return apiErrorFromException('Failed to transcribe audio. Please try again.', error);
    }
}
