# 🐛 Production Debugging Guide

## Issue: 500 Errors in Production (Works Locally)

### Symptoms
- ✅ Localhost works perfectly
- ❌ Production deployment returns 500 errors on:
  - `/api/stripe/checkout`
  - `/api/transcribe`
  - `/api/analyze-image`
  - `/api/generate/letter`

### Common Causes

#### 1. **Missing Environment Variables** (Most Likely)
Production environment variables are configured separately in Vercel and may be missing or incorrect.

#### 2. **Incorrect API Keys**
API keys that work locally might be different (test vs production) or not configured in Vercel.

#### 3. **Database Connection**
`DATABASE_URL` might point to localhost instead of production database.

#### 4. **CORS or Domain Issues**
`NEXT_PUBLIC_URL` might be set to localhost instead of production domain.

---

## 🔍 Diagnostic Tools

### 1. Check Environment Variables

Run the diagnostic script to check your local .env configuration:

```bash
npm run check:env
```

This will:
- ✅ Verify all required environment variables are present
- ⚠️  Warn about localhost configurations
- ❌ Identify missing variables
- 💡 Provide fix instructions

### 2. Test Production Deployment

Run tests specifically against the deployed build:

```bash
npm run test:production-diagnostics
```

This will:
- Test all critical API endpoints
- Detect 500 errors
- Compare local vs production responses
- Log detailed error information

### 3. Full Diagnostic Run

Run both checks together:

```bash
npm run diagnose
```

---

## 🔧 How to Fix

### Step 1: Verify Environment Variables in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/isaiahduprees-projects/steadyletters/settings/environment-variables)

2. Check that ALL these variables are set:

#### Required Variables:

**Supabase:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` ⚠️ (server-side only)
- `DATABASE_URL`

**OpenAI:**
- `OPENAI_API_KEY` ⚠️ (required for ALL API endpoints)

**Stripe:**
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY` ⚠️
- `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID`
- `NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID`
- `STRIPE_WEBHOOK_SECRET` ⚠️

**App:**
- `NEXT_PUBLIC_URL` (should be `https://www.steadyletters.com`)

### Step 2: Verify Values Are Correct

Common mistakes:

❌ **Wrong:** `NEXT_PUBLIC_URL=http://localhost:3000`
✅ **Right:** `NEXT_PUBLIC_URL=https://www.steadyletters.com`

❌ **Wrong:** `DATABASE_URL=postgresql://localhost:5432/...`
✅ **Right:** `DATABASE_URL=postgresql://[supabase-host]:5432/...`

❌ **Wrong:** Missing `OPENAI_API_KEY`
✅ **Right:** `OPENAI_API_KEY=sk-...` (must be set)

### Step 3: Add Missing Variables

#### Via Vercel Dashboard:
1. Navigate to Environment Variables settings
2. Click "Add New"
3. Enter variable name and value
4. Select "Production" environment
5. Click "Save"

#### Via Vercel CLI:
```bash
vercel env add OPENAI_API_KEY
# Paste your API key when prompted
```

### Step 4: Redeploy

After adding/updating environment variables:

```bash
vercel --prod
```

Or trigger a redeploy from Vercel Dashboard.

---

## 🔍 Detailed Diagnostic Steps

### Check Vercel Deployment Logs

1. Go to [Vercel Dashboard](https://vercel.com/isaiahduprees-projects/steadyletters)
2. Click on latest deployment
3. Click "Functions" tab
4. Look for error messages in function logs

### Check Specific API Endpoint

```bash
curl -X POST https://www.steadyletters.com/api/generate/letter \
  -H "Content-Type: application/json" \
  -d '{"context":"test","tone":"casual","occasion":"general"}'
```

Expected: `401 Unauthorized` (needs auth)
Problem: `500 Internal Server Error`

### Test with Authentication

Use the Playwright test with authentication:

```bash
npm run test:production-diagnostics
```

### Check Browser Console

1. Open https://www.steadyletters.com
2. Open Developer Tools (F12)
3. Try to use a feature (letter generation, Stripe checkout)
4. Check Console for error details
5. Check Network tab for API responses

---

## 🎯 Specific Error Solutions

### Error: "Failed to create checkout session" (Stripe)

**Cause:** Missing `STRIPE_SECRET_KEY` or `STRIPE_WEBHOOK_SECRET`

**Fix:**
```bash
# Verify Stripe keys are set in Vercel
vercel env ls | grep STRIPE

# Add if missing
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_WEBHOOK_SECRET
```

### Error: "Failed to transcribe audio" (OpenAI)

**Cause:** Missing `OPENAI_API_KEY`

**Fix:**
```bash
# Add OpenAI API key
vercel env add OPENAI_API_KEY
```

### Error: "Failed to analyze image" (OpenAI Vision)

**Cause:** Missing `OPENAI_API_KEY` or quota exceeded

**Fix:**
1. Add API key if missing
2. Check OpenAI dashboard for quota/billing

### Error: "Failed to generate letter" (OpenAI)

**Cause:** Missing `OPENAI_API_KEY` or wrong model permissions

**Fix:**
1. Ensure API key has GPT-4 access
2. Check OpenAI dashboard for API limits

### Database Connection Errors

**Cause:** Wrong `DATABASE_URL`

**Fix:**
```bash
# Get correct connection string from Supabase
# Settings → Database → Connection string

# Update in Vercel
vercel env add DATABASE_URL
```

---

## ✅ Verification Checklist

After fixing, verify:

- [ ] Run `npm run check:env` locally - should pass
- [ ] All environment variables set in Vercel
- [ ] `NEXT_PUBLIC_URL` is production URL
- [ ] `DATABASE_URL` is remote connection
- [ ] API keys are production keys (not test)
- [ ] Redeployed to Vercel
- [ ] Run `npm run test:production-diagnostics` - should pass
- [ ] Test manually in browser - should work

---

## 📊 Test Results

### Before Fix (Expected):
```
❌ Stripe checkout: 500 Internal Server Error
❌ Transcribe: 500 Internal Server Error
❌ Image analysis: 500 Internal Server Error
❌ Letter generation: 500 Internal Server Error
```

### After Fix (Expected):
```
✅ Stripe checkout: 200 OK or 401 Unauthorized (if not logged in)
✅ Transcribe: 200 OK or 401 Unauthorized
✅ Image analysis: 200 OK or 401 Unauthorized
✅ Letter generation: 200 OK or 401 Unauthorized
```

---

## 🚀 Quick Fix Commands

```bash
# 1. Check local environment
npm run check:env

# 2. Test production
npm run test:production-diagnostics

# 3. Add missing env vars to Vercel (example)
vercel env add OPENAI_API_KEY
vercel env add STRIPE_SECRET_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY

# 4. Redeploy
vercel --prod

# 5. Verify fix
npm run test:production-diagnostics
```

---

## 🆘 Still Not Working?

If the issue persists:

1. **Check Vercel Function Logs:**
   - Look for specific error messages
   - Check which variable is missing

2. **Verify API Keys Are Valid:**
   - Test OpenAI key: `curl https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY"`
   - Test Stripe key: Use Stripe CLI or dashboard

3. **Check Quotas/Limits:**
   - OpenAI: Check usage limits
   - Stripe: Check if test mode vs production mode

4. **Database Connection:**
   - Verify Supabase database is accessible
   - Check connection pooling limits

5. **Create GitHub Issue:**
   - Include error messages from Vercel logs
   - Include `npm run check:env` output (redact secrets!)
   - Include test results

---

**Last Updated:** November 25, 2024
