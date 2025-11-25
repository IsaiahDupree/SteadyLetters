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

        // Increment usage counter
        await prisma.userUsage.update({
            where: { userId },
            data: {
                imageAnalyses: { increment: 1 },
            },
        });

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
    } catch (error: any) {
        console.error('Image analysis error:', error);
        
        // Provide more detailed error in development
        const errorMessage = process.env.NODE_ENV === 'development'
            ? error.message || 'Failed to analyze image'
            : 'Failed to analyze image. Please try again.';
        
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
