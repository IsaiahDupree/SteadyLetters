import { z } from 'zod';

/**
 * Validation schema for letter generation requests
 * Note: Tone and Occasion types should match @/lib/types.ts
 */
export const letterGenerationSchema = z.object({
  context: z.string().min(10, 'Context must be at least 10 characters').max(5000, 'Context must be at most 5000 characters'),
  tone: z.enum(['formal', 'casual', 'warm', 'professional', 'friendly'], {
    message: 'Tone must be one of: formal, casual, warm, professional, friendly'
  }),
  occasion: z.enum(['general', 'birthday', 'holiday', 'congratulations', 'thank-you', 'sympathy', 'get-well-soon'], {
    message: 'Occasion must be one of: general, birthday, holiday, congratulations, thank-you, sympathy, get-well-soon'
  }),
  holiday: z.string().optional(),
  imageAnalysis: z.string().optional(),
  length: z.enum(['short', 'medium', 'long']).optional(),
});

export type LetterGenerationInput = z.infer<typeof letterGenerationSchema>;
