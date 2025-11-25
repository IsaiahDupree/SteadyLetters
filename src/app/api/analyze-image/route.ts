import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { prisma } from '@/lib/prisma';
import { canGenerate } from '@/lib/tiers';
import { trackEvent } from '@/lib/events';
import { getAuthenticatedUser } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
    try {
        // Get authenticated user
        const user = await getAuthenticatedUser(request);

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized. Please sign in to use this feature.' },
                { status: 401 }
            );
        }

        const formData = await request.formData();
        const imageFile = formData.get('image') as File;

        if (!imageFile) {
            return NextResponse.json(
                { error: 'No image file provided' },
                { status: 400 }
            );
        }

        // Check file size (20MB max for Vision API)
        if (imageFile.size > 20 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'Image file too large. Maximum size is 20MB.' },
                { status: 400 }
            );
        }

        // Get or create user usage record
        const userId = user.id;
        let usage = await prisma.userUsage.findUnique({
            where: { userId },
        });

        if (!usage) {
            usage = await prisma.userUsage.create({
                data: { userId },
            });
        }

        // Check if user can analyze images
        // For now, we'll use image generation limits
        // TODO: Add separate imageAnalyses limit
        if (!canGenerate(usage, 'image')) {
            await trackEvent({
                userId,
                eventType: 'limit_reached',
                metadata: { type: 'image_analysis', tier: usage.tier },
            });

            return NextResponse.json(
                { error: 'You have reached your image analysis limit. Please upgrade your plan.' },
                { status: 403 }
            );
        }

        // Convert image to base64 for Vision API
        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Image = buffer.toString('base64');
        const imageUrl = `data:${imageFile.type};base64,${base64Image}`;

        // Analyze image using GPT-4 Vision
        const response = await openai.chat.completions.create({
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

        // Track event
        await trackEvent({
            userId,
            eventType: 'image_analyzed',
            metadata: {
                fileSize: imageFile.size,
                fileType: imageFile.type,
                analysisLength: analysis.length,
            },
        });

        return NextResponse.json({
            analysis,
        });
    } catch (error) {
        console.error('Image analysis error:', error);
        return NextResponse.json(
            { error: 'Failed to analyze image. Please try again.' },
            { status: 500 }
        );
    }
}
