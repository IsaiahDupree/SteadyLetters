# 🔧 Populate Vercel Environment Variables & Deploy

## Quick Setup Guide

### Step 1: Get Environment Variables

We'll read from your local `.env` files and add them to Vercel.

### Step 2: Add to Vercel (Backend Project)

Go to: **Vercel Dashboard → Backend Project → Settings → Environment Variables**

---

## Backend Environment Variables

Add these variables (get values from `kindletters-backend/.env`):

### Required for Build
```bash
DATABASE_URL=postgresql://...  # ⚠️ CRITICAL - Required for Prisma generate
```

### Server Configuration
```bash
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app  # Set after frontend deploys
PORT=3001  # Optional, Vercel handles this
```

### Supabase
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### Database
```bash
DATABASE_URL=postgresql://postgres:password@host:port/database
```

### OpenAI
```bash
OPENAI_API_KEY=sk-proj-...
```

### Stripe
```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_1SXB2mBF0wJEbOgNbPR4dZhv
STRIPE_BUSINESS_PRICE_ID=price_1SXB2ZBF0wJEbOgNhEsphHHN
```

### Thanks.io
```bash
THANKS_IO_API_KEY=...
```

### Application URLs
```bash
NEXT_PUBLIC_URL=https://your-frontend.vercel.app
```

---

## Quick Add via Vercel CLI

```bash
cd /Users/isaiahdupree/Documents/Software/KindLetters/kindletters-backend

# Login to Vercel (if not already)
vercel login

# Link project (if not already linked)
vercel link

# Add each variable
vercel env add DATABASE_URL production,preview,development
# Paste value when prompted

vercel env add NODE_ENV production,preview,development
# Value: production

vercel env add NEXT_PUBLIC_SUPABASE_URL production,preview,development
# Paste your Supabase URL

# ... continue for all variables
```

---

## Automated Script

Run the helper script:

```bash
cd /Users/isaiahdupree/Documents/Software/KindLetters
./scripts/populate-vercel-env.sh
```

This will:
1. Read your local `.env` file
2. Prompt you to add each variable
3. Add them to Vercel via CLI

---

## Manual Add via Dashboard

1. Go to: **Vercel Dashboard → Your Backend Project**
2. Click **Settings** → **Environment Variables**
3. Click **"Add New"**
4. For each variable:
   - **Name**: Variable name (e.g., `DATABASE_URL`)
   - **Value**: Variable value (paste from local `.env`)
   - **Environments**: Select all (Production, Preview, Development)
   - Click **"Save"**

---

## After Adding Variables

### 1. Verify Settings
- ✅ Framework Preset: **Other** (not Next.js)
- ✅ Root Directory: **kindletters-backend**
- ✅ Build Command: **npm install && npm run build**
- ✅ Output Directory: **dist**

### 2. Commit & Push Backend Directory

```bash
cd /Users/isaiahdupree/Documents/Software/KindLetters

# Commit backend directory
git add kindletters-backend/
git commit -m "Add backend directory for Vercel deployment"
git push origin main  # or your branch
```

### 3. Deploy

**Automatic**: Vercel will auto-deploy on push

**Manual**: 
- Vercel Dashboard → Deployments → **Redeploy**

---

## Deployment Checklist

### Before Deploying
- [ ] All environment variables added to Vercel
- [ ] `DATABASE_URL` is set (required for build)
- [ ] Framework Preset set to **Other**
- [ ] Root Directory set to **kindletters-backend**
- [ ] Backend directory committed to git
- [ ] Backend directory pushed to GitHub

### After Deploying
- [ ] Build succeeds
- [ ] Health endpoint works: `https://your-backend.vercel.app/api/health`
- [ ] API endpoints accessible
- [ ] No errors in Vercel logs

---

## Quick Commands

```bash
# 1. Add environment variables
cd kindletters-backend
vercel env add DATABASE_URL production,preview,development
# ... add all variables

# 2. Commit and push
cd ..
git add kindletters-backend/
git commit -m "Add backend directory"
git push origin main

# 3. Deploy (automatic on push, or manual)
# Vercel Dashboard → Redeploy
```

---

## Troubleshooting

### Build Fails: Missing DATABASE_URL
- ✅ Make sure `DATABASE_URL` is added
- ✅ Check it's enabled for Production environment
- ✅ Verify connection string is correct

### Build Fails: Root Directory Not Found
- ✅ Make sure backend directory is committed to git
- ✅ Push to GitHub
- ✅ Verify Root Directory setting in Vercel

### Build Fails: Framework Detection
- ✅ Change Framework Preset to **Other**
- ✅ Save settings
- ✅ Redeploy

---

**Ready to populate and deploy!** 🚀

