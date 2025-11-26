# 🚀 Deploy Backend to Vercel - Complete Guide

## Step-by-Step Deployment

### Step 1: Commit Backend Directory ✅

```bash
cd /Users/isaiahdupree/Documents/Software/KindLetters

# Commit backend directory
git add kindletters-backend/
git commit -m "Add backend directory for Vercel deployment"
git push origin main  # or your branch
```

### Step 2: Add Environment Variables to Vercel

**Option A: Via Vercel Dashboard (Recommended)**

1. Go to: **Vercel Dashboard → Your Backend Project → Settings → Environment Variables**
2. Click **"Add New"** for each variable below
3. For each variable:
   - **Name**: Variable name
   - **Value**: Copy from values below
   - **Environments**: ✅ Production, ✅ Preview, ✅ Development
   - Click **"Save"**

**Option B: Via Vercel CLI**

```bash
cd /Users/isaiahdupree/Documents/Software/KindLetters/kindletters-backend

# Login (if not already)
vercel login

# Link project (if not already)
vercel link

# Add each variable (you'll paste the value when prompted)
vercel env add DATABASE_URL production,preview,development
# Paste: postgresql://postgres:postgres@127.0.0.1:54422/postgres
# ⚠️ IMPORTANT: Use your PRODUCTION database URL, not localhost!

vercel env add NODE_ENV production,preview,development
# Value: production

vercel env add FRONTEND_URL production,preview,development
# Value: https://your-frontend.vercel.app (set after frontend deploys)

vercel env add NEXT_PUBLIC_SUPABASE_URL production,preview,development
# Value: http://127.0.0.1:54421
# ⚠️ IMPORTANT: Use your PRODUCTION Supabase URL, not localhost!

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production,preview,development
# Value: sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH

vercel env add OPENAI_API_KEY production,preview,development
# Value: Your OpenAI API key (get from OpenAI Dashboard)

vercel env add STRIPE_SECRET_KEY production,preview,development
# Value: Your Stripe secret key (get from Stripe Dashboard)

vercel env add STRIPE_WEBHOOK_SECRET production,preview,development
# Value: whsec_wpSYVqwkrnnzwm60CadV4CmcD3GQTvd6

vercel env add STRIPE_PRO_PRICE_ID production,preview,development
# Value: price_1SXB2mBF0wJEbOgNbPR4dZhv

vercel env add STRIPE_BUSINESS_PRICE_ID production,preview,development
# Value: price_1SXB2ZBF0wJEbOgNhEsphHHN

vercel env add NEXT_PUBLIC_URL production,preview,development
# Value: https://your-frontend.vercel.app (set after frontend deploys)

vercel env add THANKS_IO_API_KEY production,preview,development
# Value: eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6IjNlOTUyM2E0ODI0ZWI1NTBiN2RlYmI0ZDIxMmJhOWViYzliNGQ2NGZiZmUyNTgwNjM3MGU4ZWRjMDk0YThlZjk1ZWRmNzg1YmZkZDQ1MjE4In0.eyJhdWQiOiIxIiwianRpIjoiM2U5NTIzYTQ4MjRlYjU1MGI3ZGViYjRkMjEyYmE5ZWJjOWI0ZDY0ZmJmZTI1ODA2MzczMGU4ZWRjMDk0YThlZjk1ZWRmNzg1YmZkZDQ1MjE4IiwiaWF0IjoxNzY0MDI4NjgxLCJuYmYiOjE3NjQwMjg2ODEsImV4cCI6NDkxOTcwMjI4MSwic3ViIjoiNDI5OTEiLCJzY29wZXMiOltdfQ.KksFgNxpnpc5Vzwo22cJ7vz22jlVZZfdS0jlu7eBiHUvGr33FSj68Mj2JfuUKPdI_joWPqcEFz-rPF-RQjgaBrX4yi8qO_PtFD0BoQRroNeDnLuQBRFoLFSutwDUL1JZNmQSIJHoyd81xPwISns-mhNCjF9dN1RH0gW5jytRc9vnb4p8BKiLqh2B-cgjGyCy58OUcBNyorWF-JhnT6SeRJq5REjkA38PtmxeAALcD2sQ9IuEOmqU2_UVSIflj3LszMZfuXCF9WjbgWMspF2gHlwuMw76KQ_e95qO6JejTfQd_uFkkTsV1ay8hB41qBr67nDnKvOnR-zRHzt75slfEAaKTZJ0KAv-GmXxnRoNictlMhpWNe80GJmRvbGRzWcS4AHOlcmY2OSIiap9cO52u63wij_XD_TKJxFwZlW0huSmXJ_XRclQ57SePJiGVfHdLXcL1d5qGU_IgOCOr2oI5hVKatu_24CIG1yaP0Og89qQiuoWqF11KXnhf1Ja5W9gkx0YSKRfcVXtMBmsHDUrDagLvM0vx4wD3vxwbpsfNhdoWrgQAO5SmTswek4UmRhz47hxwqOE4MfKPPtHw6gvaWl38YzRg1AaNjVULH6vvTkauKoN6VoJS1do4qtb_It_0dSCrp0Hxaqezq0UeBLZWYNeOBHTWhN-VI4eiOG14w
```

### Step 3: Verify Vercel Settings

In Vercel Dashboard → Backend Project → Settings → General:

- ✅ **Framework Preset**: **Other** (NOT Next.js)
- ✅ **Root Directory**: `kindletters-backend`
- ✅ **Build Command**: `npm install && npm run build`
- ✅ **Output Directory**: `dist`
- ✅ **Install Command**: `npm install`

### Step 4: Deploy

**Automatic**: After pushing to GitHub, Vercel will auto-deploy

**Manual**: 
- Vercel Dashboard → Deployments → **Redeploy**

---

## ⚠️ Important Notes

### Use Production URLs, Not Localhost!

When adding environment variables, use **PRODUCTION** values:

- ❌ `DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54422/postgres` (localhost)
- ✅ `DATABASE_URL=postgresql://postgres.xxx.supabase.co:5432/postgres` (production)

- ❌ `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54421` (localhost)
- ✅ `NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co` (production)

- ❌ `FRONTEND_URL=http://localhost:3000` (localhost)
- ✅ `FRONTEND_URL=https://your-frontend.vercel.app` (production)

### Update After Frontend Deploys

After frontend is deployed, update:
- `FRONTEND_URL` in backend project
- `NEXT_PUBLIC_URL` in backend project

---

## Quick Checklist

- [ ] Backend directory committed to git
- [ ] Backend directory pushed to GitHub
- [ ] All 13 environment variables added to Vercel
- [ ] Framework Preset set to **Other**
- [ ] Root Directory set to `kindletters-backend`
- [ ] Build Command: `npm install && npm run build`
- [ ] Output Directory: `dist`
- [ ] Deployed (automatic or manual)

---

## After Deployment

1. **Test Health Endpoint**
   ```
   https://your-backend.vercel.app/api/health
   ```
   Should return: `{"status":"ok",...}`

2. **Check Logs**
   - Vercel Dashboard → Deployments → Latest → Functions → View Logs

3. **Update Frontend**
   - Add `NEXT_PUBLIC_BACKEND_URL` to frontend project
   - Value: `https://your-backend.vercel.app`

---

**Ready to deploy!** 🚀

