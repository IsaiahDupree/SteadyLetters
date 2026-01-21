import { NextRequest, NextResponse } from 'next/server';
import { generateLetterContent } from '@/lib/openai';
import { prisma } from '@/lib/prisma';
import { canGenerate } from '@/lib/tiers';
import { trackEvent } from '@/lib/events';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { letterGenerationSchema } from '@/lib/validations/letter';
import { trackServerEvent } from '@/lib/posthog-server';
import { ApiErrors, apiErrorFromException } from '@/lib/api-errors';

export async function POST(request: NextRequest) {
    try {
        // Check rate limit first
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous';
        const { success, remaining } = await checkRateLimit('generation', ip);

        if (!success) {
            return ApiErrors.tooManyRequests();
        }

        // Get authenticated user
        const user = await getAuthenticatedUser(request);

        if (!user) {
            return ApiErrors.unauthorized('Unauthorized. Please sign in to generate letters.');
        }

        const body = await request.json();

        // Validate input with Zod schema
        const validationResult = letterGenerationSchema.safeParse(body);
        if (!validationResult.success) {
            return ApiErrors.badRequest('Invalid input', validationResult.error.flatten().fieldErrors);
        }

        const { context, tone, occasion, holiday, imageAnalysis, length } = validationResult.data;

        // Ensure user exists in Prisma
        const userId = user.id;
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

        // Check if user can generate
        if (!canGenerate(usage, 'letter')) {
            // Track limit reached event
            await trackEvent({
                userId,
                eventType: 'limit_reached',
                metadata: { type: 'letter_generation', tier: usage.tier },
            });

            // Track in PostHog
            await trackServerEvent(userId, 'limit_reached', {
                type: 'letter_generation',
                tier: usage.tier,
            });

            return ApiErrors.forbidden('You have reached your letter generation limit. Please upgrade your plan.');
        }

        // Generate letter using OpenAI
        const letter = await generateLetterContent({
            context,
            tone,
            occasion,
            holiday,
            imageAnalysis,
            length,
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

        // Track in PostHog
        await trackServerEvent(userId, 'letter_generated', {
            tone,
            occasion,
            holiday: holiday || null,
            tier: usage.tier,
            length: length || 'medium',
        });

        return NextResponse.json({ letter });
    } catch (error: any) {
        // Track failure in PostHog
        try {
            const user = await getAuthenticatedUser(request);
            if (user) {
                await trackServerEvent(user.id, 'letter_generation_failed', {
                    error: error.message,
                });
            }
        } catch (trackError) {
            // Silently fail tracking
            console.error('Failed to track error event:', trackError);
        }

        return apiErrorFromException('Failed to generate letter. Please try again.', error);
    }
}
