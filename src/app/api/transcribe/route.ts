import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { prisma } from '@/lib/prisma';
import { canGenerate } from '@/lib/tiers';
import { trackEvent } from '@/lib/events';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
    try {
        // Check rate limit first
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous';
        const { success, remaining } = await checkRateLimit('transcription', ip);

        if (!success) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Remaining': remaining.toString(),
                        'Retry-After': '60'
                    }
                }
            );
        }

        // Get authenticated user
        const user = await getAuthenticatedUser(request);

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized. Please sign in to use this feature.' },
                { status: 401 }
            );
        }

        const userId = user.id;

        const formData = await request.formData();
        const audioFile = formData.get('audio') as File;

        if (!audioFile) {
            return NextResponse.json(
                { error: 'No audio file provided' },
                { status: 400 }
            );
        }

        // Check file size (25MB max for Whisper)
        if (audioFile.size > 25 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'Audio file too large. Maximum size is 25MB.' },
                { status: 400 }
            );
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

            return NextResponse.json(
                { error: 'You have reached your transcription limit. Please upgrade your plan.' },
                { status: 403 }
            );
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

        return NextResponse.json({
            text: transcription.text,
        });
    } catch (error: any) {
        console.error('Transcription error:', error);
        
        // Provide more detailed error in development
        const errorMessage = process.env.NODE_ENV === 'development'
            ? error.message || 'Failed to transcribe audio'
            : 'Failed to transcribe audio. Please try again.';
        
        return NextResponse.json(
            { 
                error: errorMessage,
                ...(process.env.NODE_ENV === 'development' && { 
                    details: error.stack,
                    type: error.constructor?.name 
                })
            },
            { status: 500 }
        );
    }
}
