# ⚠️ URGENT: Add DATABASE_URL to Vercel

## Current Error

```
Missing required environment variable: DATABASE_URL
```

The build is failing because `DATABASE_URL` is not set in Vercel.

---

## Quick Fix

### Option 1: Vercel Dashboard (Fastest)

1. **Go to**: https://vercel.com/isaiahduprees-projects/steadylettersbackend/settings/environment-variables

2. **Click**: "Add New"

3. **Add Variable**:
   - **Name**: `DATABASE_URL`
   - **Value**: Your production Supabase connection string (see below)
   - **Environments**: ✅ Production, ✅ Preview, ✅ Development
   - **Click**: "Save"

4. **Redeploy**: 
   - Go to Deployments tab
   - Click "Redeploy" on latest deployment

### Option 2: Vercel CLI

```bash
cd /Users/isaiahdupree/Documents/Software/KindLetters/kindletters-backend

# Link project (if not already)
vercel link

# Add DATABASE_URL
vercel env add DATABASE_URL production,preview,development
# Paste your production Supabase connection string when prompted
```

---

## Get Production DATABASE_URL

**⚠️ CRITICAL: Use PRODUCTION URL, NOT localhost!**

### Steps:

1. Go to: **Supabase Dashboard** → Your Project
   - URL: https://supabase.com/dashboard/project/jibnaxhixzbuizscucbs

2. Click: **Settings** → **Database**

3. Find: **Connection string** section

4. Select: **Transaction mode** (port 6543) - Recommended for Vercel

5. Copy the connection string:
   ```
   postgres://postgres.jibnaxhixzbuizscucbs:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```

6. **Replace** `[YOUR-PASSWORD]` with your actual database password

### If You Don't Know Your Password:

1. Supabase Dashboard → Settings → Database
2. Click "Reset Database Password"
3. Copy the new password
4. Use it in the connection string

---

## Connection String Format

**For Vercel (Transaction mode):**
```
postgres://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**Example:**
```
postgres://postgres.jibnaxhixzbuizscucbs:your_password_here@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

---

## After Adding DATABASE_URL

1. ✅ Variable added to Vercel
2. ✅ Enabled for Production, Preview, Development
3. ✅ Redeploy the project
4. ✅ Build should succeed

---

## Verify It's Set

After adding, verify in Vercel Dashboard:
- Settings → Environment Variables
- Should see `DATABASE_URL` in the list
- Should show "Production, Preview, Development" under Environments

---

**Status**: ⚠️ **BLOCKING - Add DATABASE_URL now to continue deployment!**

