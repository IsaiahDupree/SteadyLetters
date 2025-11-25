# Production Fix Plan

## Test Results Summary

**Total Tests:** 22
**Passed:** 4 (18%)
**Failed:** 18 (82%)

### Status Code Breakdown
- **200 (Success):** 4 tests
- **405 (Method Not Allowed):** 11 tests
- **500 (Internal Server Error):** 7 tests

## Issues Identified

### 1. 405 Method Not Allowed (11 endpoints)
These endpoints are returning 405, indicating the HTTP method is not allowed or the route handler is missing.

**Affected Endpoints:**
- `/api/auth/sync-user` (POST)
- `/api/orders` (POST)
- `/api/thanks-io/send` (POST)
- `/api/transcribe` (POST)
- `/api/analyze-image` (POST)
- `/api/generate/letter` (POST)
- `/api/generate/card-image` (POST)
- `/api/generate/images` (POST)
- `/api/extract-address` (POST)
- `/api/stripe/checkout` (POST)
- `/api/post-deploy` (POST)

**Root Cause:** Next.js API routes may not be properly exported or the route handlers are missing.

**Fix:** Ensure all route files export the correct HTTP method handlers (GET, POST, etc.)

### 2. 500 Internal Server Error (7 endpoints)
These endpoints are crashing at runtime, likely due to:
- Missing environment variables
- Database connection issues
- Authentication errors
- Missing dependencies

**Affected Endpoints:**
- `/api/health` (GET)
- `/api/handwriting-styles` (GET)
- `/api/billing/usage` (GET)
- `/api/orders` (GET)
- `/api/thanks-io/products` (GET)
- `/api/thanks-io/styles` (GET)
- `/api/stripe/portal` (GET)

**Root Cause Analysis Needed:**
1. Check Vercel logs for specific error messages
2. Verify environment variables are set
3. Check database connection
4. Verify all dependencies are installed

## Implementation Plan

### Phase 1: Fix 405 Errors (Method Not Allowed)

#### Step 1.1: Verify Route Exports
- [ ] Check all API route files export the correct HTTP methods
- [ ] Ensure route handlers are properly defined
- [ ] Verify Next.js routing structure is correct

#### Step 1.2: Fix Missing Route Handlers
- [ ] `/api/auth/sync-user` - Verify POST handler exists
- [ ] `/api/orders` - Verify POST handler exists
- [ ] `/api/thanks-io/send` - Verify POST handler exists
- [ ] `/api/transcribe` - Verify POST handler exists
- [ ] `/api/analyze-image` - Verify POST handler exists
- [ ] `/api/generate/letter` - Verify POST handler exists
- [ ] `/api/generate/card-image` - Verify POST handler exists
- [ ] `/api/generate/images` - Verify POST handler exists
- [ ] `/api/extract-address` - Verify POST handler exists
- [ ] `/api/stripe/checkout` - Verify POST handler exists
- [ ] `/api/post-deploy` - Verify POST handler exists

### Phase 2: Fix 500 Errors (Internal Server Error)

#### Step 2.1: Health Check Endpoint
**File:** `src/app/api/health/route.ts`
- [ ] Verify the route is properly exported
- [ ] Check for any runtime errors
- [ ] Ensure it doesn't require authentication

#### Step 2.2: Handwriting Styles Endpoint
**File:** `src/app/api/handwriting-styles/route.ts`
- [ ] Check for database queries
- [ ] Verify error handling
- [ ] Ensure proper response format

#### Step 2.3: Billing Usage Endpoint
**File:** `src/app/api/billing/usage/route.ts`
- [ ] Verify authentication is working
- [ ] Check database queries
- [ ] Verify user exists in Prisma
- [ ] Check for missing UserUsage records

#### Step 2.4: Orders GET Endpoint
**File:** `src/app/api/orders/route.ts`
- [ ] Verify authentication
- [ ] Check database queries
- [ ] Verify Order model relationships

#### Step 2.5: Thanks.io Endpoints
**Files:** 
- `src/app/api/thanks-io/products/route.ts`
- `src/app/api/thanks-io/styles/route.ts`
- [ ] Verify authentication
- [ ] Check database queries
- [ ] Verify Thanks.io API integration
- [ ] Check for missing environment variables

#### Step 2.6: Stripe Portal Endpoint
**File:** `src/app/api/stripe/portal/route.ts`
- [ ] Verify it's a GET endpoint (currently POST in code)
- [ ] Check Stripe integration
- [ ] Verify authentication

### Phase 3: Environment Variables Verification

#### Step 3.1: Required Environment Variables
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `DATABASE_URL`
- [ ] `OPENAI_API_KEY`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `THANKS_IO_API_KEY` (if used)

#### Step 3.2: Verify in Vercel
- [ ] Check all environment variables are set in Vercel dashboard
- [ ] Verify they're available in production
- [ ] Check for typos or incorrect values

### Phase 4: Database Connection

#### Step 4.1: Prisma Connection
- [ ] Verify `DATABASE_URL` is correct
- [ ] Check database is accessible from Vercel
- [ ] Verify Prisma client is generated
- [ ] Check for connection pool issues

#### Step 4.2: User Sync
- [ ] Ensure users are synced from Supabase to Prisma
- [ ] Verify UserUsage records are created
- [ ] Check for foreign key constraints

### Phase 5: Authentication Flow

#### Step 5.1: Supabase Auth
- [ ] Verify Supabase client is properly configured
- [ ] Check cookie handling in API routes
- [ ] Verify `getAuthenticatedUser` function works

#### Step 5.2: User Sync Endpoint
- [ ] Fix 405 error on `/api/auth/sync-user`
- [ ] Ensure it properly creates users in Prisma
- [ ] Verify it handles race conditions

## Testing Strategy

### Step 1: Test with Authentication
1. Sign in to the application
2. Navigate to `/settings`
3. Run "Run Production Tests"
4. Review detailed error messages

### Step 2: Check Vercel Logs
```bash
vercel logs <deployment-url>
```

### Step 3: Test Individual Endpoints
Use the test scripts:
```bash
# Gather all test info
node scripts/gather-all-test-info.mjs

# Test with authentication
TEST_EMAIL=your@email.com TEST_PASSWORD=yourpassword node scripts/test-with-auth.mjs
```

## Priority Order

1. **High Priority:** Fix 500 errors (breaking functionality)
   - Health check
   - Billing usage
   - Orders
   - Thanks.io endpoints

2. **Medium Priority:** Fix 405 errors (method not allowed)
   - All POST endpoints
   - Post-deploy endpoint

3. **Low Priority:** Optimize and improve
   - Error messages
   - Logging
   - Performance

## Next Steps

1. ✅ Gather all test information (DONE)
2. ⏳ Review Vercel logs for specific error messages
3. ⏳ Fix 500 errors first (most critical)
4. ⏳ Fix 405 errors
5. ⏳ Re-test all endpoints
6. ⏳ Deploy fixes
7. ⏳ Verify all tests pass

## Files to Review

- `src/app/api/health/route.ts`
- `src/app/api/handwriting-styles/route.ts`
- `src/app/api/billing/usage/route.ts`
- `src/app/api/orders/route.ts`
- `src/app/api/thanks-io/products/route.ts`
- `src/app/api/thanks-io/styles/route.ts`
- `src/app/api/stripe/portal/route.ts`
- `src/lib/api-auth.ts`
- `src/lib/prisma.ts`

