import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Different limits for different endpoint types
export const rateLimiters = {
  // Generous limit for general API
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    analytics: true,
    prefix: 'ratelimit:api',
  }),

  // Strict limit for letter generation (expensive OpenAI calls)
  generation: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: true,
    prefix: 'ratelimit:generation',
  }),

  // Very strict for image generation (most expensive operation - 4 images)
  imageGeneration: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    analytics: true,
    prefix: 'ratelimit:images',
  }),

  // Moderate limit for transcription
  transcription: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: true,
    prefix: 'ratelimit:transcription',
  }),
};

/**
 * Check if a request should be rate limited
 * @param {string} limiter - The rate limiter to use (api, generation, imageGeneration, transcription)
 * @param {string} identifier - Unique identifier for the request (IP, user ID, etc.)
 * @returns {Promise<{success: boolean, remaining: number}>} Object with success status and remaining requests
 */
export async function checkRateLimit(limiter, identifier) {
  const result = await rateLimiters[limiter].limit(identifier);
  return {
    success: result.success,
    remaining: result.remaining
  };
}
