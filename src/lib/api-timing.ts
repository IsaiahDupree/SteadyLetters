import * as Sentry from '@sentry/nextjs';
import { logger } from './logger';

/**
 * Wraps an async function with timing and logging
 * Tracks API request duration and reports slow requests
 */
export async function withTiming<T>(
  name: string,
  fn: () => Promise<T>,
  options: {
    slowThreshold?: number; // ms
    logSuccess?: boolean;
  } = {}
): Promise<T> {
  const {
    slowThreshold = 1000, // Default: 1 second
    logSuccess = true,
  } = options;

  const start = performance.now();
  const startTime = new Date().toISOString();

  try {
    const result = await fn();
    const duration = performance.now() - start;

    // Log slow requests
    if (duration > slowThreshold) {
      logger.slowRequest('API', name, duration);

      // Report to Sentry
      Sentry.captureMessage(`Slow API: ${name}`, {
        level: 'warning',
        extra: {
          duration,
          threshold: slowThreshold,
          name,
        },
      });
    } else if (logSuccess) {
      logger.debug(`API call completed: ${name}`, {
        duration: Math.round(duration),
      });
    }

    return result;
  } catch (error) {
    const duration = performance.now() - start;

    logger.error(`API call failed: ${name}`, {
      duration: Math.round(duration),
      startTime,
    }, error as Error);

    // Re-throw the error after logging
    throw error;
  }
}

/**
 * Middleware wrapper for Next.js API routes
 * Automatically tracks timing for the entire request
 */
export function withApiTiming<T>(
  handler: () => Promise<T>,
  metadata?: {
    route?: string;
    method?: string;
  }
): Promise<T> {
  const routeName = metadata?.route || 'unknown';
  const method = metadata?.method || 'unknown';
  const name = `${method} ${routeName}`;

  return withTiming(name, handler, {
    slowThreshold: 2000, // API routes get 2 seconds threshold
    logSuccess: false, // Don't log every successful API call
  });
}

/**
 * Tracks database query timing
 */
export async function withDbTiming<T>(
  queryName: string,
  query: () => Promise<T>
): Promise<T> {
  return withTiming(`DB: ${queryName}`, query, {
    slowThreshold: 500, // DB queries should be faster
    logSuccess: false,
  });
}

/**
 * Tracks external API call timing (OpenAI, Thanks.io, Stripe, etc.)
 */
export async function withExternalApiTiming<T>(
  apiName: string,
  call: () => Promise<T>
): Promise<T> {
  return withTiming(`External: ${apiName}`, call, {
    slowThreshold: 5000, // External APIs can be slower
    logSuccess: true,
  });
}
