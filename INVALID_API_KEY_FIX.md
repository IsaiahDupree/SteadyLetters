# 🔑 Fix: Invalid OpenAI API Key

## Problem Identified

Your OpenAI API key is **invalid or expired**:

```
❌ 401 Incorrect API key provided: sk-proj-***...0LkA
```

This causes 500 errors on:
- `/api/transcribe` (voice transcription)
- `/api/analyze-image` (image analysis)  
- `/api/generate/letter` (letter generation)

## Root Cause

The API key in your `.env.local` file is:
- ❌ **Expired** - OpenAI keys can expire
- ❌ **Revoked** - You may have regenerated it
- ❌ **Incorrect** - Could be a typo

## Fix (2 minutes)

### Step 1: Get a New API Key

1. Go to: **https://platform.openai.com/api-keys**
2. Log in to your OpenAI account
3. Click "Create new secret key"
4. **Copy the key immediately** (you can't see it again!)

### Step 2: Update `.env.local`

Open `.env.local` and replace the old key:

```bash
# OLD (invalid)
OPENAI_API_KEY="sk-proj-lptN8olOT...0LkA"

# NEW (replace with your new key)
OPENAI_API_KEY="sk-proj-YOUR_NEW_KEY_HERE"
```

**Or use this command:**
```bash
# Edit .env.local
nano .env.local

# Find OPENAI_API_KEY line and replace the value
# Save: Ctrl+O, Enter, Ctrl+X
```

### Step 3: Restart Dev Server

```bash
# Stop current server (Ctrl+C in terminal)
npm run dev
```

### Step 4: Verify Fix

```bash
npm run validate:keys
```

Should show:
```
✅ OpenAI API key is VALID
✅ Stripe API key is VALID
```

## Test It Works

1. **Open:** http://localhost:3000
2. **Log in**
3. **Try features:**
   - ✅ Generate a letter
   - ✅ Transcribe voice
   - ✅ Analyze image

All should work now!

## Why This Happened

### Common Causes:

1. **Key Expired**
   - OpenAI project keys (sk-proj-*) can expire
   - Need to create new ones periodically

2. **Key Revoked**
   - You regenerated keys in OpenAI dashboard
   - Old keys stop working

3. **Key Limit Reached**
   - Free tier limits exceeded
   - Need to add payment method

4. **Wrong Account**
   - Key from different OpenAI account
   - Not associated with correct organization

## Validation Tool Created

We created a tool that **tests your API keys**:

```bash
npm run validate:keys
```

**What it does:**
- Makes actual API calls to OpenAI
- Makes actual API calls to Stripe
- Detects invalid/expired keys
- Provides specific error messages

**Run this before starting development!**

## Prevention

### Add to Your Workflow

```bash
# Before starting development each day:
npm run validate:keys  # Check keys are valid
npm run check:env      # Check environment variables
npm run dev            # Start dev server
```

### Auto-Check on Server Start

You can make dev server check keys automatically.

**Update package.json:**
```json
{
  "scripts": {
    "dev": "npm run validate:keys && next dev",
    "dev:force": "next dev"
  }
}
```

Now `npm run dev` will validate keys first!

## Diagnostic Commands

```bash
# Check environment variables are set
npm run check:env

# Validate API keys work
npm run validate:keys

# Test API endpoints
npm run test:api-health

# Full diagnostic
npm run diagnose:local
```

## Error Messages Decoded

### Before Fix:
```
❌ POST http://localhost:3000/api/transcribe 500 (Internal Server Error)
Error: 401 Incorrect API key provided
```

### After Fix:
```
✅ POST http://localhost:3000/api/transcribe 200 (OK)
or
✅ POST http://localhost:3000/api/transcribe 401 (Unauthorized - need to log in)
```

The difference:
- **500** = Server error (bad API key)
- **401** = Need authentication (normal behavior when not logged in)

## Production Deployment

**IMPORTANT:** After fixing locally, update Vercel too!

```bash
# Update production environment variable
vercel env add OPENAI_API_KEY
# Paste your NEW key when prompted

# Redeploy
vercel --prod

# Validate production
npm run test:production-diagnostics
```

## Verification Checklist

- [ ] Got new OpenAI API key
- [ ] Updated `.env.local` with new key
- [ ] Restarted dev server
- [ ] Run `npm run validate:keys` - shows ✅
- [ ] Tested in browser - features work
- [ ] Updated Vercel environment variables
- [ ] Redeployed to production

## Still Getting Errors?

### Check 1: Key Format

OpenAI keys should look like:
```
sk-proj-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX... (project key)
or
sk-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX... (legacy key)
```

If different format, it's not a valid OpenAI key.

### Check 2: Billing

Free tier limits:
- $5 free credit (expires after 3 months)
- Rate limits apply

Check usage: https://platform.openai.com/usage

### Check 3: Organization

If you belong to multiple OpenAI organizations:
1. Check which organization the key belongs to
2. Make sure you're testing with the right one

### Check 4: Network/Firewall

```bash
# Test OpenAI connectivity
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_KEY"
```

Should return list of models. If timeout/error, network issue.

## Related Issues

- **Environment variables not loading:** See `LOCAL_500_ERROR_FIX.md`
- **Production 500 errors:** See `PRODUCTION_DEBUGGING.md`
- **All testing guides:** See `TESTING.md`

---

## Quick Reference

```bash
# Get new key
open https://platform.openai.com/api-keys

# Update .env.local
nano .env.local  # Replace OPENAI_API_KEY value

# Restart server
npm run dev

# Validate
npm run validate:keys

# Test
npm run test:api-health
```

---

**Issue:** Invalid/expired OpenAI API key
**Fix Time:** 2 minutes
**Solution:** Get new key from OpenAI dashboard, update `.env.local`, restart server
