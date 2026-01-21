import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';
import { logger } from '@/lib/logger';
import { apiError } from '@/lib/api-errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface HealthCheck {
  status: 'ok' | 'error' | 'degraded';
  message?: string;
  responseTime?: number;
}

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  environment: string;
  checks: {
    database: HealthCheck;
    supabase: HealthCheck;
    stripe: HealthCheck;
    thanksIo: HealthCheck;
  };
}

async function checkDatabase(): Promise<HealthCheck> {
  const start = performance.now();
  try {
    // Simple query to check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Math.round(performance.now() - start);
    return { status: 'ok', responseTime };
  } catch (error) {
    logger.error('Database health check failed', {}, error as Error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Math.round(performance.now() - start),
    };
  }
}

async function checkSupabase(): Promise<HealthCheck> {
  const start = performance.now();
  try {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return { status: 'degraded', message: 'Supabase not configured' };
    }

    const responseTime = Math.round(performance.now() - start);
    return { status: 'ok', responseTime };
  } catch (error) {
    logger.error('Supabase health check failed', {}, error as Error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Math.round(performance.now() - start),
    };
  }
}

async function checkStripe(): Promise<HealthCheck> {
  const start = performance.now();
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return { status: 'degraded', message: 'Stripe not configured' };
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-11-17.clover',
    });

    // List products to verify API key works
    await stripe.products.list({ limit: 1 });
    const responseTime = Math.round(performance.now() - start);
    return { status: 'ok', responseTime };
  } catch (error) {
    logger.error('Stripe health check failed', {}, error as Error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Math.round(performance.now() - start),
    };
  }
}

async function checkThanksIo(): Promise<HealthCheck> {
  const start = performance.now();
  try {
    if (!process.env.THANKS_IO_API_KEY) {
      return { status: 'degraded', message: 'Thanks.io not configured' };
    }

    // Just check if API key is set - don't make actual API call to avoid rate limits
    const responseTime = Math.round(performance.now() - start);
    return { status: 'ok', responseTime };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Math.round(performance.now() - start),
    };
  }
}

export async function GET() {
  try {
    // Run all checks in parallel for faster response
    const [database, supabase, stripe, thanksIo] = await Promise.all([
      checkDatabase(),
      checkSupabase(),
      checkStripe(),
      checkThanksIo(),
    ]);

    const checks = { database, supabase, stripe, thanksIo };

    // Determine overall status
    const hasError = Object.values(checks).some((check) => check.status === 'error');
    const hasDegraded = Object.values(checks).some((check) => check.status === 'degraded');

    const status: 'healthy' | 'degraded' | 'unhealthy' = hasError
      ? 'unhealthy'
      : hasDegraded
      ? 'degraded'
      : 'healthy';

    const response: HealthCheckResponse = {
      status,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      checks,
    };

    // Return appropriate HTTP status code
    const httpStatus = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;

    logger.info('Health check completed', {
      status,
      checks: Object.entries(checks).map(([name, check]) => ({
        name,
        status: check.status,
        responseTime: check.responseTime,
      })),
    });

    return NextResponse.json(response, { status: httpStatus });
  } catch (error: any) {
    logger.error('Health check error', {}, error);
    return apiError('Health check failed', 500, {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
    });
  }
}
