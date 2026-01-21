/**
 * Environment Variable Validation
 *
 * This module validates all required environment variables at startup
 * and provides type-safe access to them throughout the application.
 *
 * Usage:
 *   import { env } from '@/lib/env';
 *   const apiKey = env.OPENAI_API_KEY;
 */

import { z } from 'zod';

// Define the environment variable schema
const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // App Configuration
  NEXT_PUBLIC_APP_URL: z.string().url(),

  // Database
  DATABASE_URL: z.string().url(),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // OpenAI
  OPENAI_API_KEY: z.string().startsWith('sk-'),

  // Thanks.io
  THANKS_IO_API_KEY: z.string().min(1),
  THANKS_IO_WEBHOOK_SECRET: z.string().min(1),

  // Stripe
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),

  // Upstash Redis (Rate Limiting)
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),

  // Sentry (Error Tracking) - Optional in development
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),

  // PostHog (Analytics) - Optional
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
});

// Export the inferred type
export type Env = z.infer<typeof envSchema>;

/**
 * Validates environment variables and returns a typed object
 * Throws an error if validation fails, listing all missing/invalid variables
 */
function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map((issue) => {
        const path = issue.path.join('.');
        return `  - ${path}: ${issue.message}`;
      });

      const errorMessage = [
        '❌ Environment validation failed:',
        '',
        ...missingVars,
        '',
        'Please check your .env file and ensure all required variables are set.',
        'See .env.example for reference.',
      ].join('\n');

      throw new Error(errorMessage);
    }
    throw error;
  }
}

// Validate environment variables on module load
// This ensures the app fails fast at startup if config is invalid
export const env = validateEnv();

// Log successful validation in development
if (env.NODE_ENV === 'development') {
  console.log('✅ Environment variables validated successfully');
}
