# Middleware Problem Explanation

## The Issue

We're experiencing **405 (Method Not Allowed) errors** on all POST API endpoints in production, even though:
- The routes exist and have POST handlers
- They work fine locally
- The middleware matcher is supposed to exclude `/api` routes

## Root Cause

The middleware is **incorrectly processing API routes**, which causes Next.js to return 405 errors because middleware shouldn't handle API route methods.

### Current Middleware Matcher Pattern

```typescript
'/((?!api/|_next/static|_next/image|favicon.ico|site.webmanifest|logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
```

### Why It's Not Working

The negative lookahead `(?!api/` checks if the path **doesn't start with `api/`**, but:
- Actual API paths are `/api/health`, `/api/transcribe`, etc.
- These paths start with `/`, not `api/`
- So the regex **matches** `/api/health` because it doesn't start with `api/` (it starts with `/`)

**Example:**
- Pattern checks: "Does path start with `api/`?" → No (it starts with `/`)
- Result: Pattern matches → Middleware runs → 405 error

## The Fix

We need to add an **early return** in the middleware function to explicitly skip API routes:

```typescript
export async function middleware(request: NextRequest) {
    // Skip middleware for API routes - they should not be processed by middleware
    if (request.nextUrl.pathname.startsWith('/api')) {
        return NextResponse.next();
    }
    
    // ... rest of middleware logic
}
```

This ensures that:
1. API routes are never processed by middleware
2. They go directly to their route handlers
3. POST/PUT/DELETE methods work correctly

## Why This Matters

- **405 errors** occur when middleware intercepts API routes and Next.js can't determine the correct HTTP method
- **500 errors** on some endpoints may also be related if middleware is interfering with request processing
- Authentication should be handled **inside** API routes, not in middleware for API routes

## Status

✅ **Fixed**: Added early return check for `/api` routes in middleware
- This ensures API routes bypass middleware entirely
- Authentication is handled by `getAuthenticatedUser()` inside each API route
- Middleware only handles page routes (dashboard, login, etc.)

