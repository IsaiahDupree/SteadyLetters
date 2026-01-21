/**
 * Unit tests for environment variable validation (src/lib/env.ts)
 *
 * Tests the Zod schema validation for all required environment variables
 */

import { describe, it, expect } from '@jest/globals';
import { z } from 'zod';

// Define the schema (copied from src/lib/env.ts for testing)
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  DATABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().startsWith('sk-'),
  THANKS_IO_API_KEY: z.string().min(1),
  THANKS_IO_WEBHOOK_SECRET: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
});

describe('Environment Variable Validation Schema', () => {
  describe('Valid Environment', () => {
    it('should validate a complete set of required environment variables', () => {
      const validEnv = {
        NODE_ENV: 'development',
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
        SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
        OPENAI_API_KEY: 'sk-test123',
        THANKS_IO_API_KEY: 'thanks-test-key',
        THANKS_IO_WEBHOOK_SECRET: 'webhook-secret',
        STRIPE_SECRET_KEY: 'sk_test_123',
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_123',
        STRIPE_WEBHOOK_SECRET: 'whsec_test123',
        UPSTASH_REDIS_REST_URL: 'https://redis.upstash.io',
        UPSTASH_REDIS_REST_TOKEN: 'test-token',
      };

      const result = envSchema.safeParse(validEnv);
      expect(result.success).toBe(true);
    });

    it('should accept optional Sentry variables', () => {
      const validEnv = {
        NODE_ENV: 'production',
        NEXT_PUBLIC_APP_URL: 'https://steadyletters.com',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
        SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
        OPENAI_API_KEY: 'sk-test123',
        THANKS_IO_API_KEY: 'thanks-test-key',
        THANKS_IO_WEBHOOK_SECRET: 'webhook-secret',
        STRIPE_SECRET_KEY: 'sk_test_123',
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_123',
        STRIPE_WEBHOOK_SECRET: 'whsec_test123',
        UPSTASH_REDIS_REST_URL: 'https://redis.upstash.io',
        UPSTASH_REDIS_REST_TOKEN: 'test-token',
        NEXT_PUBLIC_SENTRY_DSN: 'https://abc@sentry.io/123',
        SENTRY_AUTH_TOKEN: 'sentry-token',
        SENTRY_ORG: 'my-org',
        SENTRY_PROJECT: 'my-project',
      };

      const result = envSchema.safeParse(validEnv);
      expect(result.success).toBe(true);
    });

    it('should accept optional PostHog variables', () => {
      const validEnv = {
        NODE_ENV: 'development',
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
        SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
        OPENAI_API_KEY: 'sk-test123',
        THANKS_IO_API_KEY: 'thanks-test-key',
        THANKS_IO_WEBHOOK_SECRET: 'webhook-secret',
        STRIPE_SECRET_KEY: 'sk_test_123',
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_123',
        STRIPE_WEBHOOK_SECRET: 'whsec_test123',
        UPSTASH_REDIS_REST_URL: 'https://redis.upstash.io',
        UPSTASH_REDIS_REST_TOKEN: 'test-token',
        NEXT_PUBLIC_POSTHOG_KEY: 'phc_test123',
        NEXT_PUBLIC_POSTHOG_HOST: 'https://app.posthog.com',
      };

      const result = envSchema.safeParse(validEnv);
      expect(result.success).toBe(true);
    });

    it('should allow environment without optional variables', () => {
      const validEnv = {
        NODE_ENV: 'development',
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
        SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
        OPENAI_API_KEY: 'sk-test123',
        THANKS_IO_API_KEY: 'thanks-test-key',
        THANKS_IO_WEBHOOK_SECRET: 'webhook-secret',
        STRIPE_SECRET_KEY: 'sk_test_123',
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_123',
        STRIPE_WEBHOOK_SECRET: 'whsec_test123',
        UPSTASH_REDIS_REST_URL: 'https://redis.upstash.io',
        UPSTASH_REDIS_REST_TOKEN: 'test-token',
      };

      const result = envSchema.safeParse(validEnv);
      expect(result.success).toBe(true);
    });
  });

  describe('Missing Required Variables', () => {
    it('should fail when DATABASE_URL is missing', () => {
      const invalidEnv = {
        NODE_ENV: 'development',
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
        // DATABASE_URL missing
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
        SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
        OPENAI_API_KEY: 'sk-test123',
        THANKS_IO_API_KEY: 'thanks-test-key',
        THANKS_IO_WEBHOOK_SECRET: 'webhook-secret',
        STRIPE_SECRET_KEY: 'sk_test_123',
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_123',
        STRIPE_WEBHOOK_SECRET: 'whsec_test123',
        UPSTASH_REDIS_REST_URL: 'https://redis.upstash.io',
        UPSTASH_REDIS_REST_TOKEN: 'test-token',
      };

      const result = envSchema.safeParse(invalidEnv);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes('DATABASE_URL'))).toBe(true);
      }
    });

    it('should fail when OPENAI_API_KEY is missing', () => {
      const invalidEnv = {
        NODE_ENV: 'development',
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
        SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
        // OPENAI_API_KEY missing
        THANKS_IO_API_KEY: 'thanks-test-key',
        THANKS_IO_WEBHOOK_SECRET: 'webhook-secret',
        STRIPE_SECRET_KEY: 'sk_test_123',
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_123',
        STRIPE_WEBHOOK_SECRET: 'whsec_test123',
        UPSTASH_REDIS_REST_URL: 'https://redis.upstash.io',
        UPSTASH_REDIS_REST_TOKEN: 'test-token',
      };

      const result = envSchema.safeParse(invalidEnv);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes('OPENAI_API_KEY'))).toBe(true);
      }
    });

    it('should fail when multiple required variables are missing', () => {
      const invalidEnv = {
        NODE_ENV: 'development',
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
        // Multiple missing variables
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
      };

      const result = envSchema.safeParse(invalidEnv);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(1);
      }
    });
  });

  describe('Invalid Variable Formats', () => {
    it('should reject invalid OPENAI_API_KEY format (missing sk- prefix)', () => {
      const invalidEnv = {
        NODE_ENV: 'development',
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
        SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
        OPENAI_API_KEY: 'invalid-key', // Should start with 'sk-'
        THANKS_IO_API_KEY: 'thanks-test-key',
        THANKS_IO_WEBHOOK_SECRET: 'webhook-secret',
        STRIPE_SECRET_KEY: 'sk_test_123',
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_123',
        STRIPE_WEBHOOK_SECRET: 'whsec_test123',
        UPSTASH_REDIS_REST_URL: 'https://redis.upstash.io',
        UPSTASH_REDIS_REST_TOKEN: 'test-token',
      };

      const result = envSchema.safeParse(invalidEnv);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes('OPENAI_API_KEY'))).toBe(true);
      }
    });

    it('should reject invalid STRIPE_SECRET_KEY format (missing sk_ prefix)', () => {
      const invalidEnv = {
        NODE_ENV: 'development',
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
        SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
        OPENAI_API_KEY: 'sk-test123',
        THANKS_IO_API_KEY: 'thanks-test-key',
        THANKS_IO_WEBHOOK_SECRET: 'webhook-secret',
        STRIPE_SECRET_KEY: 'invalid-stripe-key', // Should start with 'sk_'
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_123',
        STRIPE_WEBHOOK_SECRET: 'whsec_test123',
        UPSTASH_REDIS_REST_URL: 'https://redis.upstash.io',
        UPSTASH_REDIS_REST_TOKEN: 'test-token',
      };

      const result = envSchema.safeParse(invalidEnv);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes('STRIPE_SECRET_KEY'))).toBe(true);
      }
    });

    it('should reject invalid STRIPE_PUBLISHABLE_KEY format (missing pk_ prefix)', () => {
      const invalidEnv = {
        NODE_ENV: 'development',
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
        SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
        OPENAI_API_KEY: 'sk-test123',
        THANKS_IO_API_KEY: 'thanks-test-key',
        THANKS_IO_WEBHOOK_SECRET: 'webhook-secret',
        STRIPE_SECRET_KEY: 'sk_test_123',
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'invalid-key', // Should start with 'pk_'
        STRIPE_WEBHOOK_SECRET: 'whsec_test123',
        UPSTASH_REDIS_REST_URL: 'https://redis.upstash.io',
        UPSTASH_REDIS_REST_TOKEN: 'test-token',
      };

      const result = envSchema.safeParse(invalidEnv);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'))).toBe(true);
      }
    });

    it('should reject invalid STRIPE_WEBHOOK_SECRET format (missing whsec_ prefix)', () => {
      const invalidEnv = {
        NODE_ENV: 'development',
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
        SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
        OPENAI_API_KEY: 'sk-test123',
        THANKS_IO_API_KEY: 'thanks-test-key',
        THANKS_IO_WEBHOOK_SECRET: 'webhook-secret',
        STRIPE_SECRET_KEY: 'sk_test_123',
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_123',
        STRIPE_WEBHOOK_SECRET: 'invalid-secret', // Should start with 'whsec_'
        UPSTASH_REDIS_REST_URL: 'https://redis.upstash.io',
        UPSTASH_REDIS_REST_TOKEN: 'test-token',
      };

      const result = envSchema.safeParse(invalidEnv);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes('STRIPE_WEBHOOK_SECRET'))).toBe(true);
      }
    });

    it('should reject invalid URL formats', () => {
      const invalidEnv = {
        NODE_ENV: 'development',
        NEXT_PUBLIC_APP_URL: 'not-a-url', // Invalid URL
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
        SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
        OPENAI_API_KEY: 'sk-test123',
        THANKS_IO_API_KEY: 'thanks-test-key',
        THANKS_IO_WEBHOOK_SECRET: 'webhook-secret',
        STRIPE_SECRET_KEY: 'sk_test_123',
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_123',
        STRIPE_WEBHOOK_SECRET: 'whsec_test123',
        UPSTASH_REDIS_REST_URL: 'https://redis.upstash.io',
        UPSTASH_REDIS_REST_TOKEN: 'test-token',
      };

      const result = envSchema.safeParse(invalidEnv);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes('NEXT_PUBLIC_APP_URL'))).toBe(true);
      }
    });

    it('should reject invalid NODE_ENV values', () => {
      const invalidEnv = {
        NODE_ENV: 'invalid-env', // Should be development, production, or test
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
        SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
        OPENAI_API_KEY: 'sk-test123',
        THANKS_IO_API_KEY: 'thanks-test-key',
        THANKS_IO_WEBHOOK_SECRET: 'webhook-secret',
        STRIPE_SECRET_KEY: 'sk_test_123',
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_123',
        STRIPE_WEBHOOK_SECRET: 'whsec_test123',
        UPSTASH_REDIS_REST_URL: 'https://redis.upstash.io',
        UPSTASH_REDIS_REST_TOKEN: 'test-token',
      };

      const result = envSchema.safeParse(invalidEnv);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes('NODE_ENV'))).toBe(true);
      }
    });
  });

  describe('Schema Structure', () => {
    it('should have all required fields defined', () => {
      const requiredFields = [
        'NODE_ENV',
        'NEXT_PUBLIC_APP_URL',
        'DATABASE_URL',
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'OPENAI_API_KEY',
        'THANKS_IO_API_KEY',
        'THANKS_IO_WEBHOOK_SECRET',
        'STRIPE_SECRET_KEY',
        'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
        'STRIPE_WEBHOOK_SECRET',
        'UPSTASH_REDIS_REST_URL',
        'UPSTASH_REDIS_REST_TOKEN',
      ];

      const schemaKeys = Object.keys(envSchema.shape);
      requiredFields.forEach(field => {
        expect(schemaKeys).toContain(field);
      });
    });

    it('should have optional fields defined', () => {
      const optionalFields = [
        'NEXT_PUBLIC_SENTRY_DSN',
        'SENTRY_AUTH_TOKEN',
        'SENTRY_ORG',
        'SENTRY_PROJECT',
        'NEXT_PUBLIC_POSTHOG_KEY',
        'NEXT_PUBLIC_POSTHOG_HOST',
      ];

      const schemaKeys = Object.keys(envSchema.shape);
      optionalFields.forEach(field => {
        expect(schemaKeys).toContain(field);
      });
    });
  });
});
