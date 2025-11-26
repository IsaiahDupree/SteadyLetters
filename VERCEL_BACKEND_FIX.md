# 🔧 Fix: Backend Vercel Deployment Error

## Problem

Vercel is using the **root** `vercel.json` (Next.js config) instead of the backend's `vercel.json`, causing:
- ❌ Wrong build command: `prisma generate && next build` (Next.js)
- ❌ Missing `DATABASE_URL` error during Prisma generation
- ❌ Backend detected as Next.js project

## Root Cause

When Vercel clones the repository, it finds the root `vercel.json` first and uses that configuration. The backend's `vercel.json` in `kindletters-backend/` is being ignored.

## Solution: Configure in Vercel Dashboard

### Step 1: Update Project Settings

1. Go to your **Backend Project** in Vercel Dashboard
2. Navigate to **Settings** → **General**
3. Verify/Update these settings:

   **Root Directory**: `kindletters-backend` ✅
   
   **Framework Preset**: `Other` (NOT Next.js)
   
   **Build Command**: `npm install && npm run build`
   
   **Output Directory**: `dist`
   
   **Install Command**: `npm install`

### Step 2: Add DATABASE_URL Environment Variable

**Critical**: The backend needs `DATABASE_URL` for Prisma to generate the client.

1. Go to **Settings** → **Environment Variables**
2. Click **"Add New"**
3. Add:
   - **Name**: `DATABASE_URL`
   - **Value**: Your Supabase connection string
   - **Environments**: ✅ Production, ✅ Preview, ✅ Development
4. Click **"Save"**

**Get DATABASE_URL from Supabase:**
- Go to Supabase Dashboard → Your Project
- Settings → Database
- Connection string → **Transaction mode** (port 6543)
- Copy the connection string

### Step 3: Add All Other Environment Variables

Add these to the backend project:

```bash
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
DATABASE_URL=postgresql://...  # ⚠️ REQUIRED FOR BUILD
OPENAI_API_KEY=sk-proj-...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_BUSINESS_PRICE_ID=price_...
THANKS_IO_API_KEY=...
NEXT_PUBLIC_URL=https://your-frontend.vercel.app
```

### Step 4: Redeploy

1. Go to **Deployments** tab
2. Click the **three dots** on the latest deployment
3. Click **"Redeploy"**
4. Select **"Use existing Build Cache"** (optional)
5. Click **"Redeploy"**

---

## Alternative: Use Vercel CLI

If you prefer CLI:

```bash
cd kindletters-backend

# Link project (if not linked)
vercel link

# Set root directory (if needed)
# This is done in Vercel Dashboard → Settings → General

# Add DATABASE_URL
vercel env add DATABASE_URL production
# Paste your database URL when prompted

# Add other variables
vercel env add NODE_ENV production
# Value: production

vercel env add FRONTEND_URL production
# Value: https://your-frontend.vercel.app

# ... add all other variables

# Deploy
vercel --prod
```

---

## Why DATABASE_URL is Required

The backend uses Prisma, which needs `DATABASE_URL` to:
1. Generate the Prisma Client during build (`prisma generate`)
2. Connect to the database at runtime

**Note**: Even if you don't use the database during build, Prisma requires `DATABASE_URL` to be present for `prisma generate` to work.

---

## Verification

After fixing, the build should:
1. ✅ Run `npm install` (not Next.js install)
2. ✅ Run `prisma generate` (with DATABASE_URL)
3. ✅ Run `npm run build` (TypeScript compilation)
4. ✅ Deploy Express app as serverless functions
5. ✅ NOT run `next build`

---

## Quick Checklist

- [ ] Root Directory set to `kindletters-backend` in Vercel
- [ ] Framework Preset set to `Other` (not Next.js)
- [ ] Build Command: `npm install && npm run build`
- [ ] Output Directory: `dist`
- [ ] `DATABASE_URL` environment variable added
- [ ] All other environment variables added
- [ ] Redeployed after changes

---

## Still Having Issues?

### Build Still Uses Next.js Command

**Fix**: Make sure Root Directory is set correctly:
1. Vercel Dashboard → Backend Project → Settings → General
2. **Root Directory**: Must be `kindletters-backend`
3. Save and redeploy

### DATABASE_URL Still Missing

**Fix**: 
1. Check environment variable is set for **all environments** (Production, Preview, Development)
2. Verify the variable name is exactly `DATABASE_URL` (case-sensitive)
3. Redeploy after adding

### Build Fails with TypeScript Errors

**Fix**:
1. Check build logs for specific errors
2. Verify `tsconfig.json` is correct
3. Make sure all dependencies are in `package.json`

---

**Status**: Configuration files updated. Follow steps above to fix deployment in Vercel Dashboard.
