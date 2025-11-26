# ⚡ Quick Deploy Backend - Step by Step

## 🎯 Complete Deployment Process

### Step 1: Commit & Push Backend Directory

```bash
cd /Users/isaiahdupree/Documents/Software/KindLetters

# Add and commit
git add kindletters-backend/
git commit -m "Add backend directory for Vercel deployment"

# Push
git push origin main
# or if on backend branch:
# git push origin backend
```

### Step 2: Add Environment Variables in Vercel

**Go to**: Vercel Dashboard → Your Backend Project → Settings → Environment Variables

**Add these 13 variables** (copy values from `kindletters-backend/.env`):

| Variable Name | Value Source |
|--------------|--------------|
| `DATABASE_URL` | ⚠️ Use **PRODUCTION** database URL (not localhost) |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://your-frontend.vercel.app` (set after frontend deploys) |
| `NEXT_PUBLIC_SUPABASE_URL` | ⚠️ Use **PRODUCTION** Supabase URL (not localhost) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | From `.env` file |
| `OPENAI_API_KEY` | From `.env` file |
| `STRIPE_SECRET_KEY` | From `.env` file |
| `STRIPE_WEBHOOK_SECRET` | From `.env` file |
| `STRIPE_PRO_PRICE_ID` | `price_1SXB2mBF0wJEbOgNbPR4dZhv` |
| `STRIPE_BUSINESS_PRICE_ID` | `price_1SXB2ZBF0wJEbOgNhEsphHHN` |
| `NEXT_PUBLIC_URL` | `https://your-frontend.vercel.app` (set after frontend deploys) |
| `THANKS_IO_API_KEY` | From `.env` file |
| `PORT` | `3001` (optional, Vercel handles this) |

**For each variable:**
- ✅ Select all environments: Production, Preview, Development
- ✅ Click "Save"

### Step 3: Fix Vercel Settings

**Go to**: Vercel Dashboard → Backend Project → Settings → General

**Change:**
- Framework Preset: **Other** (NOT Next.js) ⚠️
- Root Directory: `kindletters-backend` ✅
- Build Command: `npm install && npm run build` ✅
- Output Directory: `dist` ✅

**Click "Save"**

### Step 4: Deploy

**Automatic**: Vercel will auto-deploy after you push to GitHub

**Manual**: 
- Vercel Dashboard → Deployments → Latest → Three dots → **Redeploy**

---

## ⚠️ Critical: Use Production URLs

**DO NOT use localhost values!** Use production URLs:

### DATABASE_URL
- ❌ `postgresql://postgres:postgres@127.0.0.1:54422/postgres`
- ✅ `postgresql://postgres.xxx.supabase.co:5432/postgres`

**Get from**: Supabase Dashboard → Settings → Database → Connection string

### NEXT_PUBLIC_SUPABASE_URL
- ❌ `http://127.0.0.1:54421`
- ✅ `https://xxx.supabase.co`

**Get from**: Supabase Dashboard → Settings → API → Project URL

### FRONTEND_URL & NEXT_PUBLIC_URL
- Set these **after** frontend is deployed
- Use your frontend's Vercel URL

---

## Quick Commands Reference

```bash
# 1. Commit and push
cd /Users/isaiahdupree/Documents/Software/KindLetters
git add kindletters-backend/
git commit -m "Add backend directory for Vercel deployment"
git push origin main

# 2. Add env vars via CLI (optional)
cd kindletters-backend
vercel env add DATABASE_URL production,preview,development
# Paste value when prompted
# Repeat for all variables
```

---

## After Deployment

1. **Test Health Endpoint**
   ```
   https://your-backend.vercel.app/api/health
   ```
   Should return: `{"status":"ok",...}`

2. **Update Frontend**
   - Add `NEXT_PUBLIC_BACKEND_URL` to frontend project
   - Value: `https://your-backend.vercel.app`

3. **Configure Stripe Webhook**
   - Stripe Dashboard → Webhooks
   - Add: `https://your-backend.vercel.app/api/stripe/webhook`

---

## Troubleshooting

### Build Fails: Missing DATABASE_URL
- ✅ Make sure `DATABASE_URL` is added in Vercel
- ✅ Use **production** database URL, not localhost
- ✅ Check it's enabled for Production environment

### Build Fails: Root Directory Not Found
- ✅ Make sure backend directory is committed to git
- ✅ Push to GitHub
- ✅ Verify Root Directory = `kindletters-backend` in Vercel

### Build Fails: Framework Detection
- ✅ Change Framework Preset to **Other**
- ✅ Save settings
- ✅ Redeploy

---

**Ready to deploy!** Follow steps 1-4 above. 🚀

