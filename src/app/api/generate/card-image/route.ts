import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { trackEvent } from '@/lib/events';
import { canGenerate } from '@/lib/tiers';

export async function POST(request: NextRequest) {
    try {
        // Get authenticated user
        const user = await getAuthenticatedUser(request);

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized. Please sign in to generate images.' },
                { status: 401 }
            );
        }

        const { tone, occasion, letterContent, imageAnalysis } = await request.json();

        if (!tone && !occasion && !letterContent) {
            return NextResponse.json(
                { error: 'Missing context for image generation (need tone, occasion, or letter content)' },
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
            usage = await prisma.userUsage.create({
                data: { userId, tier: 'FREE' },
            });
        }

        // Check if user can generate images
        if (!canGenerate(usage, 'image')) {
            // Track limit reached event
            await trackEvent({
                userId,
                eventType: 'limit_reached',
                metadata: { type: 'image_generation', tier: usage.tier },
            });

            return NextResponse.json(
                { error: 'You have reached your image generation limit. Please upgrade your plan.' },
                { status: 403 }
            );
        }

        // Build comprehensive prompt for card front design
        const occasionDescriptions: Record<string, string> = {
            general: 'elegant and timeless greeting card',
            birthday: 'joyful birthday card with celebratory elements like balloons, confetti, or festive patterns',
            holiday: 'festive holiday-themed card with seasonal decorations',
            congratulations: 'celebratory card with uplifting and victorious imagery',
            'thank-you': 'warm and appreciative card with heartfelt elements like flowers or nature',
            sympathy: 'gentle and comforting card with soft, peaceful imagery',
            'get-well-soon': 'uplifting card with bright, hopeful elements',
        };

        const toneDescriptions: Record<string, string> = {
            formal: 'sophisticated, classic design with refined colors and elegant patterns',
            casual: 'relaxed, friendly design with bright, approachable colors',
            warm: 'inviting design with soft pastels, gentle gradients, and cozy elements',
            professional: 'clean, modern design with minimalist aesthetic and refined palette',
            friendly: 'cheerful, welcoming design with vibrant colors and positive energy',
        };

        const occasionDesc = occasionDescriptions[occasion as string] || 'elegant greeting card';
        const toneDesc = toneDescriptions[tone as string] || 'warm and inviting design';

        // Build context from image analysis
        const imageContext = imageAnalysis 
            ? `\n\nVisual inspiration: ${imageAnalysis}. Incorporate similar colors, mood, patterns, and aesthetic elements.`
            : '';

        // Build context from letter content (extract key themes)
        const letterContext = letterContent && typeof letterContent === 'string'
            ? `\n\nLetter themes to reflect: The letter expresses ${letterContent.substring(0, 200)}...`
            : '';

        const comprehensivePrompt = `
CARD FRONT DESIGN - COMPLETE FULL-PAGE LAYOUT:

Design the ENTIRE front face of a ${occasionDesc}.
This is a SINGLE-SIDED, FULL-PAGE card front design (not front and back, not a folded card).

STYLE REQUIREMENTS:
${toneDesc}${imageContext}${letterContext}

DESIGN SPECIFICATIONS:
- Fill the ENTIRE rectangular card front with a cohesive, complete design
- Create a unified composition from edge to edge
- Use decorative patterns, nature elements, abstract art, or elegant borders
- Suitable for professional printing on greeting card stock
- High-end, premium quality aesthetic

IMPORTANT EXCLUSIONS:
- NO people, faces, or human figures of any kind
- NO text, words, or letters
- NO logos or branding
- Focus entirely on decorative, abstract, or nature-based imagery

COMPOSITION:
- Full-page design with balanced visual weight
- Consider leaving subtle space in center or bottom third for future handwritten message
- Beautiful, cohesive, and complete card front design
`.trim();

        // Generate card front image using DALL-E
        const response = await openai.images.generate({
            model: 'dall-e-3',
            prompt: comprehensivePrompt,
            n: 1,
            size: '1024x1024',
            quality: 'standard',
        });

        const imageUrl = response.data?.[0]?.url;

        if (!imageUrl || !response.data) {
            return NextResponse.json(
                { error: 'Failed to generate image' },
                { status: 500 }
            );
        }

        // Increment usage counter
        await prisma.userUsage.update({
            where: { userId },
            data: {
                imageGenerations: { increment: 1 },
            },
        });

        // Track event
        await trackEvent({
            userId,
            eventType: 'image_generated',
            metadata: {
                type: 'card_front',
                tone,
                occasion,
                hasImageAnalysis: !!imageAnalysis,
            },
        });

        return NextResponse.json({
            imageUrl,
            tone,
            occasion,
        });
    } catch (error) {
        console.error('Card image generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate card image. Please try again.' },
            { status: 500 }
        );
    }
}
