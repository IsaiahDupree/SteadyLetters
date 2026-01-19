# SteadyLetters: Gap Analysis & Improvement Opportunities

**Version:** 1.0  
**Date:** January 19, 2026  
**Status:** Analysis Complete  
**Author:** Development Team

---

## 1. Executive Summary

This document identifies gaps not covered by existing PRDs and proposes new features, code improvements, and technical debt items for consideration in the current development stage.

**Key Findings:**
- Current PRDs understate implementation progress
- Usage enforcement IS implemented (contrary to status report)
- Several security and UX improvements are low-hanging fruit
- Mobile optimization remains the largest gap

---

## 2. PRD Accuracy Corrections

### Items Marked "In Progress" That Are Actually Complete

| Feature | Actual Status | Evidence |
|---------|---------------|----------|
| Usage limit enforcement | ✅ **Complete** | `generate/letter/route.ts:56-68`, `generate/images/route.ts:56-68` |
| Image generation limits | ✅ **Complete** | Enforces limits, tracks per-image usage |
| Event tracking | ✅ **Complete** | `lib/events.ts` with full CRUD |
| Stripe webhook signature | ✅ **Complete** | `stripe/webhook/route.ts:21-33` |
| Tier auto-update on subscription | ✅ **Complete** | Updates `UserUsage.tier` on checkout |

### True Remaining Gaps

| Gap | Priority | Estimated Effort |
|-----|----------|------------------|
| Mobile navigation (hamburger menu) | HIGH | 2-3 hours |
| Mobile CSS utilities | HIGH | 1 hour |
| Thanks.io webhook signature verification | MEDIUM | 1 hour |
| Order send action usage enforcement | MEDIUM | 30 min |

---

## 3. New PRD Opportunities

### 3.1 PRD: Error Monitoring & Observability

**Not Currently Covered**

| Component | Current State | Recommendation |
|-----------|---------------|----------------|
| Error tracking | Console.error only | Integrate Sentry |
| Performance monitoring | None | Add Vercel Analytics or PostHog |
| API latency tracking | None | Add timing middleware |
| User session recording | None | Consider LogRocket/FullStory |

**Estimated Effort:** 1-2 days

---

### 3.2 PRD: Rate Limiting & Abuse Prevention

**Not Currently Covered**

| Risk | Current Mitigation | Recommendation |
|------|-------------------|----------------|
| API abuse | None | Add rate limiting middleware |
| Brute force auth | Supabase default | Monitor failed auth attempts |
| Webhook spam | None (Thanks.io) | Add signature verification |
| DDOS | Vercel default | Consider Cloudflare |

**Implementation Options:**
- Use `@upstash/ratelimit` with Redis
- Implement in-memory rate limiting for MVP
- Add per-user, per-endpoint limits

**Estimated Effort:** 4-8 hours

---

### 3.3 PRD: Scheduled Jobs & Background Tasks

**Not Currently Covered**

| Task | Current State | Recommendation |
|------|---------------|----------------|
| Usage reset | On-demand check | Cron job on 1st of month |
| Subscription expiry check | Webhook only | Daily verification job |
| Stale order cleanup | None | Weekly cleanup of pending > 7 days |
| Analytics aggregation | None | Daily rollup for dashboard |

**Implementation Options:**
- Vercel Cron (free tier: 2 jobs)
- QStash for serverless queues
- External service (e.g., Inngest)

**Estimated Effort:** 1 day

---

### 3.4 PRD: Address Validation

**Partially Covered in Main PRD**

| Feature | Current State | Recommendation |
|---------|---------------|----------------|
| Format validation | AI extraction | Add USPS API validation |
| Deliverability check | None | Validate before send |
| International addresses | Basic support | Add country-specific formatting |
| Autocomplete | None | Google Places or Smarty API |

**Estimated Effort:** 2-3 days

---

### 3.5 PRD: Accessibility (A11y)

**Not Currently Covered**

| Requirement | Current State | Gap |
|-------------|---------------|-----|
| WCAG 2.1 AA compliance | Unknown | Needs audit |
| Keyboard navigation | Partial | Test all flows |
| Screen reader support | Unknown | Add ARIA labels |
| Focus management | Unknown | Test modals, forms |
| Color contrast | Custom theme | Verify ratios |

**Estimated Effort:** 2-3 days

---

## 4. Code Improvements (Technical Debt)

### 4.1 DRY Violations

**Repeated Auth Pattern**

The `getCurrentUser()` function is duplicated across:
- `src/app/actions/dashboard.ts`
- `src/app/actions/recipients.ts`
- `src/app/actions/templates.ts`
- `src/app/actions/orders.ts`

**Recommendation:** Extract to shared utility:
```typescript
// src/lib/server-auth.ts
export async function getCurrentUser() { ... }
```

**Effort:** 30 minutes

---

### 4.2 Type Safety Improvements

| File | Issue | Fix |
|------|-------|-----|
| `thanks-io.ts:103` | `any` type for API response | Define `ThanksIoStyleResponse` interface |
| `orders.ts:78` | `HandwritingColor` as `any` | Use proper union type |
| `stripe/webhook/route.ts:46,78` | `as any` casts | Define proper Stripe types |

**Effort:** 1-2 hours

---

### 4.3 Error Handling Standardization

**Current State:** Inconsistent error response formats

**Recommendation:** Create unified error response:
```typescript
// src/lib/api-errors.ts
export function apiError(message: string, status: number, details?: any) {
  return NextResponse.json(
    { error: message, ...(process.env.NODE_ENV === 'development' && { details }) },
    { status }
  );
}
```

**Effort:** 2 hours

---

### 4.4 Environment Variable Validation

**Current State:** Runtime failures if env vars missing

**Recommendation:** Add startup validation:
```typescript
// src/lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  // ... etc
});

export const env = envSchema.parse(process.env);
```

**Effort:** 1 hour

---

### 4.5 Test Coverage Gaps

**Well-covered:**
- API endpoints (48+ test files)
- E2E flows (Playwright specs)
- Integration tests

**Missing:**
- Server action unit tests
- Component tests (limited)
- Mobile responsive tests

**Effort:** 1-2 days for comprehensive coverage

---

## 5. Security Improvements

### 5.1 Thanks.io Webhook Signature

**Current:** No signature verification  
**Risk:** Medium - anyone can send fake status updates

**Fix Location:** `src/app/api/webhooks/thanks/route.ts`

```typescript
// Add signature verification
const signature = request.headers.get('x-thanks-signature');
if (!verifyThanksSignature(body, signature)) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
}
```

---

### 5.2 Input Sanitization

**Current:** Relies on Prisma parameterization  
**Recommendation:** Add explicit sanitization for user-facing text (XSS prevention)

---

### 5.3 CORS Configuration

**Current:** Default Next.js behavior  
**Recommendation:** Explicit CORS headers for API routes

---

## 6. Performance Optimizations

| Area | Current | Improvement |
|------|---------|-------------|
| Dashboard queries | 6 parallel queries | Good, no change needed |
| Image generation | 4 parallel DALL-E calls | Consider queue for rate limits |
| Database connections | Prisma default | Add connection pooling config |
| Static pages | Dynamic forced | Pre-render where possible |

---

## 7. Priority Matrix

### Implement Now (This Sprint)

1. **Mobile navbar** - Critical UX, 2-3 hours
2. **Mobile CSS utilities** - 1 hour
3. **Extract shared auth utility** - 30 min
4. **Thanks.io webhook signature** - 1 hour

### Implement Soon (Next Sprint)

5. **Rate limiting** - Security, 4-8 hours
6. **Error monitoring (Sentry)** - Observability, 2-4 hours
7. **Type safety cleanup** - Code quality, 2 hours

### Backlog

8. Address validation API
9. Accessibility audit
10. Scheduled jobs infrastructure
11. Comprehensive component tests

---

## 8. Recommended New PRD Files

Based on this analysis, recommend creating:

| PRD | Priority | Covers |
|-----|----------|--------|
| `PRD_SECURITY_HARDENING.md` | HIGH | Webhook signatures, rate limiting, CORS |
| `PRD_OBSERVABILITY.md` | MEDIUM | Error tracking, analytics, logging |
| `PRD_ACCESSIBILITY.md` | MEDIUM | WCAG compliance, keyboard nav, screen readers |
| `PRD_ADDRESS_VALIDATION.md` | LOW | USPS API, autocomplete, international |

---

**Document Created:** January 19, 2026  
**Next Review:** After mobile optimization complete
