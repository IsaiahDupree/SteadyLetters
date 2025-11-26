# ✅ Deployment Checklist - Backend to Vercel

## ✅ Step 1: Git Push - COMPLETE

- ✅ Backend directory committed (53 files)
- ✅ Pushed to `backend` branch
- ✅ Available on GitHub

**Commit**: `f9a9cbc - Add backend directory for Vercel deployment`

---

## 📋 Step 2: Add Environment Variables (DO THIS NOW)

**Go to**: Vercel Dashboard → Your Backend Project → Settings → Environment Variables

### Add These 13 Variables:

Copy values from `kindletters-backend/.env`, but **use PRODUCTION URLs** (not localhost):

1. **DATABASE_URL** ⚠️ **CRITICAL - REQUIRED FOR BUILD**
   - ❌ DON'T use: `postgresql://postgres:postgres@127.0.0.1:54422/postgres`
   - ✅ DO use: Your production Supabase connection string
   - Get from: Supabase Dashboard → Settings → Database → Connection string
   - Format: `postgresql://postgres.xxx.supabase.co:5432/postgres`

2. **NODE_ENV**
   - Value: `production`

3. **FRONTEND_URL**
   - Value: `https://your-frontend.vercel.app` (update after frontend deploys)
   - For now: `https://steadyletters.vercel.app` or your frontend URL

4. **NEXT_PUBLIC_SUPABASE_URL** ⚠️
   - ❌ DON'T use: `http://127.0.0.1:54421`
   - ✅ DO use: Your production Supabase URL
   - Get from: Supabase Dashboard → Settings → API → Project URL
   - Format: `https://xxx.supabase.co`

5. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Value: `sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH`
   - (Or your production key from Supabase)

6. **OPENAI_API_KEY**
   - Value: Your OpenAI API key (get from OpenAI Dashboard)

7. **STRIPE_SECRET_KEY**
   - Value: Your Stripe secret key (get from Stripe Dashboard)

8. **STRIPE_WEBHOOK_SECRET**
   - Value: `whsec_wpSYVqwkrnnzwm60CadV4CmcD3GQTvd6`

9. **STRIPE_PRO_PRICE_ID**
   - Value: `price_1SXB2mBF0wJEbOgNbPR4dZhv`

10. **STRIPE_BUSINESS_PRICE_ID**
    - Value: `price_1SXB2ZBF0wJEbOgNhEsphHHN`

11. **NEXT_PUBLIC_URL**
    - Value: `https://your-frontend.vercel.app` (update after frontend deploys)

12. **THANKS_IO_API_KEY**
    - Value: `eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6IjNlOTUyM2E0ODI0ZWI1NTBiN2RlYmI0ZDIxMmJhOWViYzliNGQ2NGZiZmUyNTgwNjM3MGU4ZWRjMDk0YThlZjk1ZWRmNzg1YmZkZDQ1MjE4In0.eyJhdWQiOiIxIiwianRpIjoiM2U5NTIzYTQ4MjRlYjU1MGI3ZGViYjRkMjEyYmE5ZWJjOWI0ZDY0ZmJmZTI1ODA2MzczMGU4ZWRjMDk0YThlZjk1ZWRmNzg1YmZkZDQ1MjE4IiwiaWF0IjoxNzY0MDI4NjgxLCJuYmYiOjE3NjQwMjg2ODEsImV4cCI6NDkxOTcwMjI4MSwic3ViIjoiNDI5OTEiLCJzY29wZXMiOltdfQ.KksFgNxpnpc5Vzwo22cJ7vz22jlVZZfdS0jlu7eBiHUvGr33FSj68Mj2JfuUKPdI_joWPqcEFz-rPF-RQjgaBrX4yi8qO_PtFD0BoQRroNeDnLuQBRFoLFSutwDUL1JZNmQSIJHoyd81xPwISns-mhNCjF9dN1RH0gW5jytRc9vnb4p8BKiLqh2B-cgjGyCy58OUcBNyorWF-JhnT6SeRJq5REjkA38PtmxeAALcD2sQ9IuEOmqU2_UVSIflj3LszMZfuXCF9WjbgWMspF2gHlwuMw76KQ_e95qO6JejTfQd_uFkkTsV1ay8hB41qBr67nDnKvOnR-zRHzt75slfEAaKTZJ0KAv-GmXxnRoNictlMhpWNe80GJmRvbGRzWcS4AHOlcmY2OSIiap9cO52u63wij_XD_TKJxFwZlW0huSmXJ_XRclQ57SePJiGVfHdLXcL1d5qGU_IgOCOr2oI5hVKatu_24CIG1yaP0Og89qQiuoWqF11KXnhf1Ja5W9gkx0YSKRfcVXtMBmsHDUrDagLvM0vx4wD3vxwbpsfNhdoWrgQAO5SmTswek4UmRhz47hxwqOE4MfKPPtHw6gvaWl38YzRg1AaNjVULH6vvTkauKoN6VoJS1do4qtb_It_0dSCrp0Hxaqezq0UeBLZWYNeOBHTWhN-VI4eiOG14w`

13. **PORT** (Optional)
    - Value: `3001`

**For each variable:**
- ✅ Select all environments: **Production**, **Preview**, **Development**
- ✅ Click **"Save"**

---

## ⚙️ Step 3: Verify Vercel Settings

**Go to**: Vercel Dashboard → Backend Project → Settings → General

### Critical Settings:

- ✅ **Framework Preset**: **Other** (NOT Next.js) ⚠️ **MUST BE "Other"**
- ✅ **Root Directory**: `kindletters-backend`
- ✅ **Build Command**: `npm install && npm run build`
- ✅ **Output Directory**: `dist`
- ✅ **Install Command**: `npm install`

### If Framework Preset is "Next.js":
1. Change dropdown to **"Other"**
2. Click **"Save"**
3. Settings will reset - verify Build Command and Output Directory are correct

### Branch Configuration:
- If deploying from `backend` branch, make sure Vercel is configured to deploy from that branch
- Or merge `backend` branch to `main` and deploy from `main`

---

## 🚀 Step 4: Deploy

### Option A: Automatic (Recommended)
- Vercel will auto-deploy when you push to the configured branch
- Check: Vercel Dashboard → Deployments

### Option B: Manual
1. Go to: Vercel Dashboard → Deployments
2. Click **"Redeploy"** on latest deployment
3. Or click **"Deploy"** button

---

## ✅ Step 5: Verify Deployment

After deployment:

1. **Check Build Status**
   - Vercel Dashboard → Deployments → Latest
   - Should show: ✅ **Ready** (green)

2. **Test Health Endpoint**
   ```
   https://your-backend.vercel.app/api/health
   ```
   Should return: `{"status":"ok","timestamp":"...","service":"kindletters-backend"}`

3. **Check Logs**
   - Vercel Dashboard → Deployments → Latest → Functions → View Logs
   - Should show no errors

---

## 🔗 Quick Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Environment Variables**: Vercel Dashboard → Project → Settings → Environment Variables
- **Deployments**: Vercel Dashboard → Project → Deployments
- **GitHub Repository**: https://github.com/IsaiahDupree/SteadyLetters

---

## ⚠️ Critical Reminders

1. **DATABASE_URL** - MUST be production URL (not localhost) - Required for build!
2. **NEXT_PUBLIC_SUPABASE_URL** - MUST be production URL (not localhost)
3. **Framework Preset** - MUST be "Other" (not Next.js)
4. **FRONTEND_URL** - Can update after frontend deploys
5. **All variables** - Must be enabled for Production, Preview, Development

---

## 🎯 Current Status

- ✅ Git push complete
- ⏳ Add environment variables (DO THIS NOW)
- ⏳ Verify Vercel settings
- ⏳ Deploy
- ⏳ Test deployment

---

**Next Action**: Go to Vercel Dashboard and add environment variables! 🚀

