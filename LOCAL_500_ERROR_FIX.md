# 🔧 Fix: 500 Errors on Localhost

## Problem

You're seeing 500 Internal Server Errors on localhost:

```
❌ POST http://localhost:3000/api/transcribe 500 (Internal Server Error)
❌ POST http://localhost:3000/api/analyze-image 500 (Internal Server Error)
❌ POST http://localhost:3000/api/generate/letter 500 (Internal Server Error)
```

## Root Cause

**Next.js doesn't load `.env` file in development - it requires `.env.local`**

You have your API keys in `.env`, but Next.js only loads:
- `.env.local` (highest priority)
- `.env.development`
- `.env`(lowest priority, often ignored for sensitive keys)

## Quick Fix (30 seconds)

### Option 1: Automated Fix Script

```bash
npm run fix:local-env
```

This will:
1. Copy `.env` to `.env.local`
2. Verify the copy succeeded
3. Tell you to restart your dev server

### Option 2: Manual Fix

```bash
# Copy your .env to .env.local
cp .env .env.local

# Restart your dev server
# Stop the current server (Ctrl+C)
npm run dev
```

## Verify It's Fixed

### Step 1: Check Environment

```bash
npm run check:env
```

Should show:
```
✅ OPENAI_API_KEY
✅ STRIPE_SECRET_KEY
✅ DATABASE_URL
... etc
```

### Step 2: Test API Endpoints

```bash
npm run test:api-health
```

Should show:
```
✅ /api/generate/letter returns 401 (expected: unauthorized)
✅ /api/transcribe returns 401 (expected: unauthorized)
✅ /api/analyze-image returns 401 (expected: unauthorized)
```

### Step 3: Test in Browser

1. **Restart dev server:**
   ```bash
   npm run dev
   ```

2. **Open http://localhost:3000**

3. **Try features:**
   - Generate a letter ✅
   - Transcribe voice ✅
   - Analyze image ✅
   - Stripe checkout ✅

All should work now!

## Why This Happens

Next.js has a specific order for loading environment variables:

```
Priority (highest to lowest):
1. .env.local          ← REQUIRED for local dev
2. .env.development    ← Optional
3. .env                ← Usually NOT loaded for sensitive keys
```

For security, Next.js expects sensitive keys (API keys, secrets) to be in `.env.local` which is gitignored.

Your `.env` file contains the keys, but Next.js isn't loading them.

## What Changed

**Before:**
- ❌ API keys in `.env` (not loaded)
- ❌ 500 errors on all API endpoints
- ❌ "Failed to transcribe audio"
- ❌ "Failed to analyze image"
- ❌ "Failed to create checkout session"

**After:**
- ✅ API keys in `.env.local` (loaded by Next.js)
- ✅ APIs work correctly
- ✅ Returns 401 (unauthorized) instead of 500 when not logged in
- ✅ Works when logged in

## Tests Created

### 1. API Health Check Test

```bash
npm run test:api-health
```

**Purpose:** Detects 500 errors on API endpoints before you even start the app.

**What it checks:**
- All critical API endpoints
- Detects missing environment variables
- Logs specific error messages
- Provides fix instructions

### 2. Full Local Diagnostic

```bash
npm run diagnose:local
```

**Purpose:** Complete health check of your local environment.

**What it does:**
1. Checks all environment variables
2. Tests all API endpoints
3. Identifies root causes
4. Provides fix commands

## Detailed Error Analysis

### Error in Console

```
voice-recorder.tsx:111 Transcription error: Error: Failed to transcribe audio. Please try again.
at transcribeAudio (voice-recorder.tsx:105:23)
```

**What's happening:**
1. Frontend sends audio to `/api/transcribe`
2. API route tries to call OpenAI
3. `OPENAI_API_KEY` is undefined (not loaded from `.env`)
4. OpenAI call fails
5. API returns 500 error
6. Frontend shows "Failed to transcribe"

**Fix:** Copy `.env` to `.env.local`, restart dev server

### Same Issue for Other Endpoints

All these endpoints use OpenAI:
- `/api/transcribe` - Uses Whisper API
- `/api/analyze-image` - Uses Vision API
- `/api/generate/letter` - Uses GPT-4 API

All fail the same way if `OPENAI_API_KEY` isn't loaded.

## Prevention

### Before Starting Development

Always run:
```bash
# 1. Check environment
npm run check:env

# 2. If missing, fix it
npm run fix:local-env

# 3. Start dev server
npm run dev
```

### Add to Your Workflow

Add this check to your development startup:

**package.json:**
```json
{
  "scripts": {
    "dev": "npm run check:env && next dev",
    "dev:force": "next dev"
  }
}
```

Now `npm run dev` will check environment first!

## Verification Checklist

- [ ] Run `npm run check:env` - all variables present
- [ ] `.env.local` file exists
- [ ] Dev server restarted
- [ ] Run `npm run test:api-health` - no 500 errors
- [ ] Test in browser - features work
- [ ] No console errors

## Still Not Working?

### Check 1: Environment Variables Loaded

Add this to any API route temporarily:
```typescript
console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
```

Should log `true`. If `false`, environment not loaded.

### Check 2: Valid API Key

Test your OpenAI key:
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_OPENAI_API_KEY"
```

Should return list of models. If error, key is invalid.

### Check 3: Dev Server Restart

Environment variables are loaded at server start. Must restart after changes:
```bash
# Stop server (Ctrl+C)
npm run dev
```

### Check 4: File Permissions

Ensure `.env.local` is readable:
```bash
ls -la .env.local
# Should show: -rw-r--r--
```

## Related Documentation

- **Production Issues:** `PRODUCTION_DEBUGGING.md`
- **Production Tests:** `PRODUCTION_ISSUE_SUMMARY.md`
- **All Tests:** `TESTING.md`
- **Diagnostic Tools:** `scripts/check-production-env.mjs`

---

## Quick Reference

```bash
# Fix environment
npm run fix:local-env

# Check environment
npm run check:env

# Test API health
npm run test:api-health

# Full diagnostic
npm run diagnose:local

# Restart dev server
npm run dev
```

---

**Status:** ✅ Fixed - Environment variables now properly loaded
**Time to Fix:** ~30 seconds
**Files Changed:** Created `.env.local` (copy of `.env`)
