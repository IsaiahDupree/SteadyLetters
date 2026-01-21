import { NextRequest, NextResponse } from 'next/server';
import { generateCardImage } from '@/lib/openai';
import { prisma } from '@/lib/prisma';
import { canGenerate } from '@/lib/tiers';
import { trackEvent } from '@/lib/events';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { trackServerEvent } from '@/lib/posthog-server';

export async function POST(request: NextRequest) {
    try {
        // Check rate limit first (stricter limit for expensive image generation)
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous';
        const { success, remaining } = await checkRateLimit('imageGeneration', ip);

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
                { error: 'Unauthorized. Please sign in to generate images.' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { occasion, tone, holiday, imageAnalysis } = body;

        if (!occasion || !tone) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Ensure user exists in Prisma
        const userId = user.id;
        await prisma.user.upsert({
            where: { id: userId },
            update: {}, // No update needed if exists
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

        // Check if user can generate images (need 4 credits for 4 images)
        const canGenerateImages = canGenerate(usage, 'image');
        if (!canGenerateImages) {
            await trackEvent({
                userId,
                eventType: 'limit_reached',
                metadata: { type: 'image_generation', tier: usage.tier },
            });

            // Track in PostHog
            await trackServerEvent(userId, 'limit_reached', {
                type: 'image_generation',
                tier: usage.tier,
            });

            return NextResponse.json(
                { error: 'You have reached your image generation limit. Please upgrade your plan.' },
                { status: 403 }
            );
        }

        // Generate 4 images using DALL-E 3
        const imagePromises = Array.from({ length: 4 }, (_, i) =>
            generateCardImage({ occasion, tone, holiday, imageAnalysis }).catch(error => {
                console.error(`Failed to generate image ${i + 1}:`, error);
                return null;
            })
        );

        const images = await Promise.all(imagePromises);

        // Filter out failed generations
        const validImages = images.filter((url): url is string => url !== null);

        if (validImages.length === 0) {
            return NextResponse.json(
                { error: 'Failed to generate images. Please try again.' },
                { status: 500 }
            );
        }

        // Increment usage counter by the number of images generated
        await prisma.userUsage.update({
            where: { userId },
            data: {
                imageGenerations: { increment: validImages.length },
            },
        });

        // Track event for each image generated
        for (let i = 0; i < validImages.length; i++) {
            await trackEvent({
                userId,
                eventType: 'image_generated',
                metadata: {
                    occasion,
                    tone,
                    tier: usage.tier,
                },
            });
        }

        // Track in PostHog (single event with count)
        await trackServerEvent(userId, 'image_generated', {
            occasion,
            tone,
            tier: usage.tier,
            count: validImages.length,
        });

        return NextResponse.json({ images: validImages });
    } catch (error: any) {
        console.error('Failed to generate images:', error);

        // Track failure in PostHog
        try {
            const user = await getAuthenticatedUser(request);
            if (user) {
                await trackServerEvent(user.id, 'image_generation_failed', {
                    error: error.message,
                });
            }
        } catch (trackError) {
            // Silently fail tracking
            console.error('Failed to track error event:', trackError);
        }

        // Provide more detailed error in development
        const errorMessage = process.env.NODE_ENV === 'development'
            ? error.message || 'Failed to generate images'
            : 'Failed to generate images. Please try again.';

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
