import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { trackEvent } from '@/lib/events';
import { canGenerate } from '@/lib/tiers';

interface ExtractedAddress {
    name?: string;
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
}

export async function POST(request: NextRequest) {
    try {
        // Get authenticated user
        const user = await getAuthenticatedUser(request);

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized. Please sign in to extract addresses.' },
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
            usage = await prisma.userUsage.create({
                data: { userId, tier: 'FREE' },
            });
        }

        // Check if user can analyze images (using image analysis limit)
        // Note: This uses imageGenerations limit, but we should track imageAnalyses separately
        // For now, we'll use the same limit
        if (!canGenerate(usage, 'image')) {
            await trackEvent({
                userId,
                eventType: 'limit_reached',
                metadata: { type: 'address_extraction', tier: usage.tier },
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

        // Extract return address using GPT-4 Vision
        const prompt = `Look at this image of a letter or envelope. Find the RETURN ADDRESS (the sender's address, typically in the top-left corner of an envelope or at the top of a letter).

Extract the return address information and return it as a JSON object with the following structure:
{
  "name": "Full name or organization name",
  "address1": "Street address line 1",
  "address2": "Street address line 2 (if present, otherwise omit)",
  "city": "City name",
  "state": "State abbreviation (2 letters, e.g., "CA", "NY")",
  "zip": "ZIP code (5 or 9 digits)",
  "country": "Country code (default to "US" if not visible)"
}

Important:
- Only extract the RETURN ADDRESS (sender's address), NOT the recipient/delivery address
- If you cannot find a return address, return an empty object: {}
- Return ONLY valid JSON, no additional text or explanation
- If any field is not visible or unclear, omit it from the JSON object
- State should be a 2-letter abbreviation (e.g., "CA", "NY", "TX")
- ZIP should be 5 digits, or 9 digits with a hyphen (e.g., "90210" or "90210-1234")
- Name should be the full name or organization name from the return address`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: prompt,
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
            max_tokens: 500,
            response_format: { type: 'json_object' },
        });

        const content = response.choices[0].message.content || '{}';
        let extractedAddress: ExtractedAddress = {};

        try {
            extractedAddress = JSON.parse(content);
        } catch (parseError) {
            console.error('Failed to parse address JSON:', parseError);
            // Try to extract JSON from the response if it's wrapped in text
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    extractedAddress = JSON.parse(jsonMatch[0]);
                } catch (e) {
                    console.error('Failed to parse extracted JSON:', e);
                }
            }
        }

        // Validate that we have at least some address information
        const hasAddress = extractedAddress.address1 || extractedAddress.city || extractedAddress.zip;

        // Increment usage counter (using image analysis tracking)
        // Note: We should track imageAnalyses separately, but for now using imageGenerations
        await prisma.userUsage.update({
            where: { userId },
            data: {
                imageGenerations: { increment: 1 },
            },
        });

        // Track event
        await trackEvent({
            userId,
            eventType: 'image_analyzed',
            metadata: {
                type: 'address_extraction',
                fileSize: imageFile.size,
                fileType: imageFile.type,
                hasAddress: !!hasAddress,
            },
        });

        if (!hasAddress) {
            return NextResponse.json({
                address: null,
                message: 'No return address found in the image. Please try a different image.',
            });
        }

        return NextResponse.json({
            address: extractedAddress,
            message: 'Return address found! Would you like to add this as a recipient?',
        });
    } catch (error: any) {
        console.error('Address extraction error:', error);
        
        // Provide more detailed error in development
        const errorMessage = process.env.NODE_ENV === 'development'
            ? error.message || 'Failed to extract address'
            : 'Failed to extract address. Please try again.';
        
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

