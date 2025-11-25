# 🚨 Production Issue: 500 Errors (Works on Localhost)

## Problem

The deployed build on Vercel returns **500 Internal Server Errors** on multiple API endpoints that work perfectly on localhost:

- ❌ `/api/stripe/checkout` → 500 error
- ❌ `/api/transcribe` → 500 error
- ❌ `/api/analyze-image` → 500 error
- ❌ `/api/generate/letter` → 500 error

## Root Cause

**Missing or misconfigured environment variables in Vercel.**

All these endpoints require server-side API keys and configuration that are present in your local `.env.local` file but may not be configured in Vercel's production environment.

## Solution

### 🎯 Immediate Fix

1. **Check which variables are missing:**
   ```bash
   npm run check:env
   ```

2. **Add missing variables to Vercel:**
   - Go to: https://vercel.com/isaiahduprees-projects/steadyletters/settings/environment-variables
   - Add all variables shown as missing
   - Or use CLI: `vercel env add VARIABLE_NAME`

3. **Redeploy:**
   ```bash
   vercel --prod
   ```

4. **Verify fix:**
   ```bash
   npm run test:production-diagnostics
   ```

### 📋 Required Environment Variables

Critical variables that MUST be set in Vercel:

**OpenAI (Required for ALL failing endpoints):**
- `OPENAI_API_KEY` ⚠️ **CRITICAL**

**Stripe (Required for checkout):**
- `STRIPE_SECRET_KEY` ⚠️ **CRITICAL**
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID`
- `NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID`
- `STRIPE_WEBHOOK_SECRET`

**Supabase/Database:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **CRITICAL**
- `DATABASE_URL`

**App Configuration:**
- `NEXT_PUBLIC_URL` (should be `https://www.steadyletters.com`)

## Testing Tools Created

### 1. Environment Diagnostic Script
```bash
npm run check:env
```
**What it does:**
- ✅ Checks if all required env vars are present
- ⚠️ Warns about localhost configurations
- 💡 Provides specific fix instructions

### 2. Production Diagnostic Tests
```bash
npm run test:production-diagnostics
```
**What it does:**
- Tests all API endpoints against production
- Detects 500 errors
- Compares local vs production behavior
- Logs detailed error information

### 3. Full Diagnostic
```bash
npm run diagnose
```
Runs both checks together.

## Test Files Created

1. **`tests/e2e/production-diagnostics.spec.ts`**
   - Comprehensive Playwright tests for production
   - Tests each failing endpoint
   - Detects environment-specific issues
   - Provides detailed error logging

2. **`scripts/check-production-env.mjs`**
   - Checks local environment configuration
   - Validates all required variables
   - Warns about common misconfigurations

3. **`PRODUCTION_DEBUGGING.md`**
   - Complete debugging guide
   - Step-by-step fix instructions
   - Common error solutions

## How to Verify It's Fixed

### Before Fix:
```
Test Stripe checkout → ❌ 500 Internal Server Error
Test transcribe → ❌ 500 Internal Server Error
Test image analysis → ❌ 500 Internal Server Error
Test letter generation → ❌ 500 Internal Server Error
```

### After Fix:
```
Test Stripe checkout → ✅ 200 OK (or 401 if not authenticated)
Test transcribe → ✅ 200 OK (or 401 if not authenticated)
Test image analysis → ✅ 200 OK (or 401 if not authenticated)
Test letter generation → ✅ 200 OK (or 401 if not authenticated)
```

## Step-by-Step Resolution

### Step 1: Identify Missing Variables
```bash
npm run check:env
```
This will show you EXACTLY which variables are missing.

### Step 2: Get Variable Values

If you have a local `.env.local` file that works:
```bash
cat .env.local
```

Or retrieve from source:
- **Supabase:** https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
- **OpenAI:** https://platform.openai.com/api-keys
- **Stripe:** https://dashboard.stripe.com/apikeys

### Step 3: Add to Vercel

**Option A: Vercel Dashboard**
1. Go to https://vercel.com/isaiahduprees-projects/steadyletters/settings/environment-variables
2. Click "Add New"
3. Enter name and value
4. Select "Production" environment
5. Click "Save"

**Option B: Vercel CLI**
```bash
vercel env add OPENAI_API_KEY
# Paste value when prompted

vercel env add STRIPE_SECRET_KEY
# Paste value when prompted

# Repeat for all missing variables
```

### Step 4: Redeploy
```bash
vercel --prod
```

### Step 5: Test Production
```bash
npm run test:production-diagnostics
```

Should now show all tests passing ✅

### Step 6: Manual Verification
1. Visit https://www.steadyletters.com
2. Log in
3. Try features:
   - Generate a letter
   - Transcribe voice
   - Analyze image
   - Click Stripe checkout

All should work now! 🎉

## Why It Worked Locally

Your local `.env.local` file contains all the necessary API keys and configuration. When you run `npm run dev`, Next.js loads these variables automatically.

However, Vercel has a completely separate environment. You must configure environment variables in Vercel's dashboard for production deployments.

## Prevention

To prevent this in the future:

1. **Always check environment variables before deploying:**
   ```bash
   npm run check:env
   ```

2. **Test production immediately after deployment:**
   ```bash
   npm run test:production-diagnostics
   ```

3. **Use the diagnostic tools:**
   ```bash
   npm run diagnose
   ```

4. **Keep documentation updated:**
   - See `PRODUCTION_DEBUGGING.md` for detailed guide
   - See `TESTING.md` for all testing commands

## Additional Resources

- **Full Debugging Guide:** `PRODUCTION_DEBUGGING.md`
- **Testing Guide:** `TESTING.md`
- **Vercel Environment Variables:** https://vercel.com/docs/concepts/projects/environment-variables
- **Next.js Environment Variables:** https://nextjs.org/docs/basic-features/environment-variables

---

## Quick Reference

```bash
# Check what's missing
npm run check:env

# Test production
npm run test:production-diagnostics

# Full diagnostic
npm run diagnose

# Add env vars to Vercel
vercel env add OPENAI_API_KEY
vercel env add STRIPE_SECRET_KEY
# ... add all missing vars

# Redeploy
vercel --prod

# Verify
npm run test:production-diagnostics
```

---

**Status:** 🔍 Diagnostic tools created, ready to fix production environment
**Next Step:** Add missing environment variables to Vercel and redeploy
