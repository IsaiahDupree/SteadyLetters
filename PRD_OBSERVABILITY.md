# PRD: Observability & Monitoring

**Version:** 1.0  
**Date:** January 19, 2026  
**Status:** Ready for Implementation  
**Priority:** Medium  
**Estimated Effort:** 1 day

---

## 1. Overview

### Problem Statement
Currently, errors are logged to console only and there's no visibility into application performance, user behavior, or system health in production.

### Goals
1. Capture and alert on application errors
2. Track key user flows and conversion metrics
3. Monitor API performance and latency
4. Enable debugging of production issues

### Success Metrics
- [ ] 100% of unhandled errors captured
- [ ] Key user actions tracked (signup, generate, send)
- [ ] P95 latency visible for all API routes
- [ ] Alerts configured for error spikes

---

## 2. Requirements

### 2.1 Error Tracking (Sentry)

**Package:** `@sentry/nextjs`

**Setup:**
```bash
npx @sentry/wizard@latest -i nextjs
```

**Configuration:**
```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% of transactions
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

**Custom Error Boundaries:**
```typescript
// src/components/error-boundary.tsx
'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export function ErrorFallback({ error, resetErrorBoundary }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="p-4 text-center">
      <h2>Something went wrong</h2>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}
```

---

### 2.2 Analytics (PostHog or Vercel Analytics)

**Option A: Vercel Analytics (Simpler)**
```bash
npm install @vercel/analytics
```

```typescript
// src/app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

**Option B: PostHog (More Features)**
```typescript
// src/lib/posthog.ts
import posthog from 'posthog-js';

export function initPostHog() {
  if (typeof window !== 'undefined') {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      capture_pageview: false, // Manual control
    });
  }
}

// Track custom events
export function trackEvent(event: string, properties?: Record<string, any>) {
  posthog.capture(event, properties);
}
```

**Key Events to Track:**
| Event | Properties |
|-------|------------|
| `user_signed_up` | `{ method: 'email' \| 'oauth' }` |
| `letter_generated` | `{ tone, occasion, tier }` |
| `image_generated` | `{ count, tier }` |
| `order_created` | `{ product_type, amount }` |
| `subscription_started` | `{ plan, price }` |
| `limit_reached` | `{ type, tier }` |

---

### 2.3 API Performance Monitoring

**Middleware Approach:**
```typescript
// src/lib/api-timing.ts
import * as Sentry from '@sentry/nextjs';

export function withTiming<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  
  return fn().finally(() => {
    const duration = performance.now() - start;
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`[SLOW] ${name}: ${duration.toFixed(0)}ms`);
      Sentry.captureMessage(`Slow API: ${name}`, {
        level: 'warning',
        extra: { duration },
      });
    }
  });
}
```

**Usage:**
```typescript
export async function POST(request: NextRequest) {
  return withTiming('generate/letter', async () => {
    // ... handler logic
  });
}
```

---

### 2.4 Health Check Dashboard

**Endpoint:** `GET /api/health`

**Enhanced Response:**
```typescript
// src/app/api/health/route.ts
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    supabase: await checkSupabase(),
    stripe: await checkStripe(),
    thanksIo: await checkThanksIo(),
  };

  const allHealthy = Object.values(checks).every(c => c.status === 'ok');

  return NextResponse.json({
    status: allHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
  }, { status: allHealthy ? 200 : 503 });
}

async function checkDatabase() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'ok' };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}
```

---

### 2.5 Logging Standards

**Structured Logging:**
```typescript
// src/lib/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
}

export function log(level: LogLevel, message: string, context?: Record<string, any>) {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
  };

  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else if (level === 'warn') {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

// Convenience methods
export const logger = {
  debug: (msg: string, ctx?: Record<string, any>) => log('debug', msg, ctx),
  info: (msg: string, ctx?: Record<string, any>) => log('info', msg, ctx),
  warn: (msg: string, ctx?: Record<string, any>) => log('warn', msg, ctx),
  error: (msg: string, ctx?: Record<string, any>) => log('error', msg, ctx),
};
```

---

## 3. Environment Variables

```env
# Sentry
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# PostHog (if using)
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

---

## 4. Alerts Configuration

| Alert | Trigger | Channel |
|-------|---------|---------|
| Error spike | >10 errors in 5 min | Slack/Email |
| Slow API | P95 > 3s for 10 min | Slack |
| Health check fail | 3 consecutive failures | PagerDuty/Email |
| Subscription churn | User cancels | Email |

---

## 5. Files to Create/Modify

| File | Action |
|------|--------|
| `sentry.client.config.ts` | Create |
| `sentry.server.config.ts` | Create |
| `sentry.edge.config.ts` | Create |
| `src/lib/logger.ts` | Create |
| `src/lib/posthog.ts` | Create (if using) |
| `src/app/layout.tsx` | Add Analytics component |
| `src/app/api/health/route.ts` | Enhance |

---

## 6. Definition of Done

- [ ] Sentry capturing errors in production
- [ ] Analytics tracking key user events
- [ ] Health check endpoint returns service status
- [ ] Structured logging implemented
- [ ] Alerts configured for critical issues
- [ ] Dashboard accessible to team

---

**Document Created:** January 19, 2026  
**Author:** Development Team
