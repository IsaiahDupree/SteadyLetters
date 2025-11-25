import { NextRequest, NextResponse } from 'next/server';
import { generateLetterContent } from '@/lib/openai';
import { prisma } from '@/lib/prisma';
import { canGenerate } from '@/lib/tiers';
import { trackEvent } from '@/lib/events';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { context, tone, occasion, holiday, imageAnalysis } = body;

        if (!context || !tone || !occasion) {
            return NextResponse.json(
                { error: 'Missing required fields' },
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

        // Check if user can generate
        if (!canGenerate(usage, 'letter')) {
            // Track limit reached event
            await trackEvent({
                userId,
                eventType: 'limit_reached',
                metadata: { type: 'letter_generation', tier: usage.tier },
            });

            return NextResponse.json(
                { error: 'You have reached your letter generation limit. Please upgrade your plan.' },
                { status: 403 }
            );
        }

        // Generate letter using OpenAI
        const letter = await generateLetterContent({
            context,
            tone,
            occasion,
            holiday,
            imageAnalysis,
        });

        // Increment usage counter
        await prisma.userUsage.update({
            where: { userId },
            data: {
                letterGenerations: { increment: 1 },
            },
        });

        // Track successful generation
        await trackEvent({
            userId,
            eventType: 'letter_generated',
            metadata: { tone, occasion, holiday: holiday || null },
        });

        return NextResponse.json({ letter });
    } catch (error) {
        console.error('Failed to generate letter:', error);
        return NextResponse.json(
            { error: 'Failed to generate letter. Please try again.' },
            { status: 500 }
        );
    }
}
