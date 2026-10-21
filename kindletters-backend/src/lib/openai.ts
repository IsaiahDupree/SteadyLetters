import OpenAI from 'openai';

// Lazy initialization - only create client when API key is available
let openaiInstance: OpenAI | null = null;

function getOpenAI(): OpenAI {
    if (!openaiInstance) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY environment variable is not set');
        }
        openaiInstance = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    return openaiInstance;
}

import type { Tone, Occasion } from './types';

export async function generateLetterContent(params: {
    context: string;
    tone: Tone;
    occasion: Occasion;
    holiday?: string;
    imageAnalysis?: string;
    length?: 'short' | 'medium' | 'long';
}): Promise<string> {
    const { context, tone, occasion, holiday, imageAnalysis, length = 'medium' } = params;

    const occasionText = occasion === 'general' ? '' : `This is a ${occasion.replace('-', ' ')} letter.`;
    const holidayText = holiday ? `Apply a ${holiday} theme to the letter.` : '';
    const imageContext = imageAnalysis
        ? `Image Context: The user provided an image showing: ${imageAnalysis}. Incorporate relevant elements from this image into the letter in a natural way.`
        : '';

    // Adjust length based on user selection
    const lengthGuidelines = {
        short: '50-100 words. Keep it brief and to the point.',
        medium: '150-250 words. Standard letter length.',
        long: '300-500 words. Detailed and comprehensive.',
    };

    const maxTokens = {
        short: 200,
        medium: 500,
        long: 1000,
    };

    const prompt = `You are writing a heartfelt handwritten letter.

Context: ${context}
Tone: ${tone}
${occasionText}
${holidayText}
${imageContext}

Write a warm, personal letter suitable for sending via physical mail.
Length: ${lengthGuidelines[length]}
Include a greeting and closing.
Make it sound natural and human, not AI-generated.
Do not include a date or recipient address.`;

    const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: maxTokens[length],
    });

    return completion.choices[0]?.message?.content || '';
}

export async function generateCardImage(params: {
    occasion: Occasion;
    holiday?: string;
    tone: Tone;
    imageAnalysis?: string;
}): Promise<string> {
    const { occasion, holiday, tone, imageAnalysis } = params;

    // Color palette based on tone
    const colorPalettes = {
        formal: 'classic navy and gold',
        casual: 'bright and playful colors',
        warm: 'soft pastels and warm tones',
        professional: 'clean white and gray',
        friendly: 'cheerful yellow and blue',
    };

    const occasionDescriptions = {
        general: 'elegant greeting card',
        birthday: 'birthday celebration card with balloons and confetti',
        holiday: `${holiday || 'holiday'} themed card`,
        congratulations: 'congratulations card with celebratory elements',
        'thank-you': 'thank you card with heartfelt imagery',
        sympathy: 'sympathy card with gentle, comforting imagery',
        'get-well-soon': 'get well soon card with uplifting elements',
    };

    const imageContext = imageAnalysis
        ? `Inspired by this image: ${imageAnalysis}. Incorporate similar colors, mood, and elements.`
        : '';

    const prompt = `A beautiful ${occasionDescriptions[occasion]}.
${holiday ? `Include ${holiday} elements like decorations and symbols.` : ''}
${imageContext}
Style: ${colorPalettes[tone]}, elegant, minimal, suitable for a physical greeting card.
Clean design with space for text. No text in the image.`;

    const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt,
        size: '1024x1024',
        quality: 'standard',
        n: 1,
    });

    return response.data?.[0]?.url || '';
}

// Export getter function instead of instance
export const openai = {
    get client() {
        return getOpenAI();
    },
    // Proxy common methods for backward compatibility
    chat: {
        completions: {
            create: (params: any) => getOpenAI().chat.completions.create(params),
        },
    },
    audio: {
        transcriptions: {
            create: (params: any) => getOpenAI().audio.transcriptions.create(params),
        },
    },
    images: {
        generate: (params: any) => getOpenAI().images.generate(params),
    },
} as any;
