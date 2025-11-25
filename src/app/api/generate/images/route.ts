import { NextRequest, NextResponse } from 'next/server';
import { generateCardImage } from '@/lib/openai';
import { prisma } from '@/lib/prisma';
import { canGenerate } from '@/lib/tiers';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { occasion, tone, holiday, imageAnalysis } = body;

        if (!occasion || !tone) {
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

        // Check if user can generate images (need 4 credits for 4 images)
        const canGenerateImages = canGenerate(usage, 'image');
        if (!canGenerateImages) {
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

        return NextResponse.json({ images: validImages });
    } catch (error) {
        console.error('Failed to generate images:', error);
        return NextResponse.json(
            { error: 'Failed to generate images. Please try again.' },
            { status: 500 }
        );
    }
}
