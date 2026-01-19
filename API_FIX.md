# 🔧 API 500 Error Fix - Production Deployment

## Problem

API endpoints were returning 500 errors in production but working locally:
- `/api/stripe/checkout` - 500 error
- `/api/transcribe` - 500 error  
- `/api/analyze-image` - 500 error
- `/api/generate/letter` - 500 error

## Root Cause

When users authenticate via Supabase, they might not exist in the Prisma database yet. The API routes were trying to:
1. Access `UserUsage` records for users that don't exist in Prisma
2. Create Stripe customers for users that don't exist in Prisma
3. Update Prisma records that don't exist

This caused database errors (foreign key violations, record not found) resulting in 500 errors.

## Solution

### 1. User Upsert Pattern
All API routes now ensure users exist in Prisma before operations:

```typescript
// Ensure user exists in Prisma
await prisma.user.upsert({
    where: { id: userId },
    update: {}, // No update needed if exists
    create: {
        id: userId,
        email: user.email!,
    },
});

// Ensure UserUsage exists
await prisma.userUsage.upsert({
    where: { userId },
    update: {},
    create: {
        userId,
        tier: 'FREE',
    },
});
```

### 2. Improved Stripe Customer Creation
Updated `getOrCreateStripeCustomer` to:
- Check if user exists, create if not
- Handle race conditions with try/catch
- Use upsert pattern for safety

### 3. Better Error Handling
- Added detailed error messages in development
- Improved error logging
- More graceful error handling

## Files Changed

1. `src/app/api/stripe/checkout/route.ts`
   - Added user upsert before Stripe operations
   - Improved error handling

2. `src/lib/stripe.ts`
   - Updated `getOrCreateStripeCustomer` to ensure user exists
   - Added race condition handling

3. `src/app/api/transcribe/route.ts`
   - Added user upsert before usage checks

4. `src/app/api/analyze-image/route.ts`
   - Added user upsert before usage checks

5. `src/app/api/generate/letter/route.ts`
   - Added user upsert before usage checks

## Testing

After deployment, verify:
- ✅ Stripe checkout works
- ✅ Voice transcription works
- ✅ Image analysis works
- ✅ Letter generation works

## Prevention

This pattern should be used in all API routes that access user data:
1. Always upsert user first
2. Always upsert UserUsage if needed
3. Then proceed with the operation

---

**Status:** ✅ Fixed and deployed to production


