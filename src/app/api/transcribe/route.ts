import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { prisma } from '@/lib/prisma';
import { canGenerate } from '@/lib/tiers';
import { trackEvent } from '@/lib/events';

export async function POST(request: NextRequest) {
    try {
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

        // Get or create user usage record
        const userId = 'default-user'; // TODO: Get from auth
        let usage = await prisma.userUsage.findUnique({
            where: { userId },
        });

        if (!usage) {
            usage = await prisma.userUsage.create({
                data: { userId },
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
    } catch (error) {
        console.error('Transcription error:', error);
        return NextResponse.json(
            { error: 'Failed to transcribe audio. Please try again.' },
            { status: 500 }
        );
    }
}
