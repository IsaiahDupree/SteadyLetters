# PRD: Security Hardening

**Version:** 1.0  
**Date:** January 19, 2026  
**Status:** Ready for Implementation  
**Priority:** High  
**Estimated Effort:** 1-2 days

---

## 1. Overview

### Problem Statement
The SteadyLetters application has functional security through Supabase Auth and Stripe webhook verification, but lacks comprehensive protection against API abuse, webhook spoofing (Thanks.io), and standardized security headers.

### Goals
1. Verify all webhook sources with cryptographic signatures
2. Implement rate limiting to prevent abuse
3. Add security headers for defense in depth
4. Standardize input validation

### Success Metrics
- [ ] All webhooks verify signatures before processing
- [ ] Rate limiting active on all public endpoints
- [ ] Security headers score A+ on securityheaders.com
- [ ] No unvalidated external input reaches database

---

## 2. Requirements

### 2.1 Thanks.io Webhook Signature Verification

**Current State:** Webhook accepts any POST request with valid JSON

**File:** `src/app/api/webhooks/thanks/route.ts`

**Implementation:**
```typescript
import crypto from 'crypto';

function verifyThanksSignature(payload: string, signature: string | null): boolean {
  if (!signature || !process.env.THANKS_IO_WEBHOOK_SECRET) {
    return false;
  }
  
  const expectedSignature = crypto
    .createHmac('sha256', process.env.THANKS_IO_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
    
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('x-thanks-signature');
  
  if (!verifyThanksSignature(body, signature)) {
    console.warn('[Thanks.io Webhook] Invalid signature rejected');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }
  
  const data = JSON.parse(body);
  // ... rest of handler
}
```

**Environment Variable:**
```
THANKS_IO_WEBHOOK_SECRET=your_webhook_secret_here
```

---

### 2.2 Rate Limiting

**Current State:** No rate limiting on API endpoints

**Recommended Package:** `@upstash/ratelimit` with `@upstash/redis`

**Implementation:**

```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Different limits for different endpoint types
export const rateLimiters = {
  // Generous limit for general API
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    analytics: true,
  }),
  
  // Stricter limit for expensive operations
  generation: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: true,
  }),
  
  // Very strict for auth endpoints
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    analytics: true,
  }),
};

export async function checkRateLimit(
  limiter: keyof typeof rateLimiters,
  identifier: string
): Promise<{ success: boolean; remaining: number }> {
  const result = await rateLimiters[limiter].limit(identifier);
  return { success: result.success, remaining: result.remaining };
}
```

**Usage in API Route:**
```typescript
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'anonymous';
  const { success, remaining } = await checkRateLimit('generation', ip);
  
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { 
        status: 429,
        headers: { 'X-RateLimit-Remaining': remaining.toString() }
      }
    );
  }
  
  // ... rest of handler
}
```

---

### 2.3 Security Headers

**File:** `next.config.js` or middleware

**Implementation:**
```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(self), geolocation=()'
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

---

### 2.4 Input Validation with Zod

**Current State:** Basic validation in route handlers

**Recommendation:** Standardize with Zod schemas

```typescript
// src/lib/validations/letter.ts
import { z } from 'zod';

export const letterGenerationSchema = z.object({
  context: z.string().min(10).max(5000),
  tone: z.enum(['warm', 'professional', 'casual', 'formal', 'heartfelt']),
  occasion: z.enum(['thank_you', 'birthday', 'congratulations', 'thinking_of_you', 'holiday', 'other']),
  holiday: z.string().optional(),
  imageAnalysis: z.string().optional(),
  length: z.enum(['short', 'medium', 'long']).optional(),
});

export const recipientSchema = z.object({
  name: z.string().min(1).max(100),
  address1: z.string().min(1).max(200),
  address2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(2).max(50),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/),
  country: z.string().default('US'),
});
```

**Usage:**
```typescript
const result = letterGenerationSchema.safeParse(body);
if (!result.success) {
  return NextResponse.json(
    { error: 'Invalid input', details: result.error.flatten() },
    { status: 400 }
  );
}
const { context, tone, occasion } = result.data;
```

---

## 3. Files to Modify

| File | Change |
|------|--------|
| `src/app/api/webhooks/thanks/route.ts` | Add signature verification |
| `src/lib/rate-limit.ts` | Create new file |
| `src/app/api/generate/letter/route.ts` | Add rate limiting |
| `src/app/api/generate/images/route.ts` | Add rate limiting |
| `src/app/api/transcribe/route.ts` | Add rate limiting |
| `next.config.js` | Add security headers |
| `src/lib/validations/` | Create validation schemas |

---

## 4. Environment Variables Required

```env
# Thanks.io Webhook
THANKS_IO_WEBHOOK_SECRET=

# Upstash Redis (for rate limiting)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

---

## 5. Testing Checklist

- [ ] Thanks.io webhook rejects requests without valid signature
- [ ] Thanks.io webhook accepts requests with valid signature
- [ ] Rate limit returns 429 after threshold exceeded
- [ ] Rate limit resets after window expires
- [ ] Security headers present on all responses
- [ ] Invalid input returns 400 with helpful error message

---

## 6. Definition of Done

- [ ] All webhooks verify signatures
- [ ] Rate limiting deployed and tested
- [ ] Security headers configured
- [ ] Input validation standardized with Zod
- [ ] Documentation updated
- [ ] Security scan passes (no critical/high issues)

---

**Document Created:** January 19, 2026  
**Author:** Development Team
