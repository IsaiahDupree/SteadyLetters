# 🚀 Quick Start: Deploy to Vercel

## Prerequisites

- Vercel account: [Sign up](https://vercel.com/signup)
- GitHub repository connected
- Environment variables ready (see below)

## Option 1: Deploy via Vercel Dashboard (Recommended for First Time)

### Step 1: Deploy Frontend

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `/` (root)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
5. Add Environment Variables (see below)
6. Click **"Deploy"**

### Step 2: Deploy Backend

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New"** → **"Project"**
3. Import the **same** GitHub repository
4. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: `kindletters-backend`
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variables (see below)
6. Click **"Deploy"**

### Step 3: Link Frontend and Backend

1. **Get Backend URL** from Vercel (e.g., `https://kindletters-backend.vercel.app`)
2. **Update Frontend Environment Variable**:
   - Go to Frontend project → Settings → Environment Variables
   - Add/Update: `NEXT_PUBLIC_BACKEND_URL=https://kindletters-backend.vercel.app`
   - Redeploy frontend

3. **Get Frontend URL** from Vercel (e.g., `https://steadyletters.vercel.app`)
4. **Update Backend Environment Variable**:
   - Go to Backend project → Settings → Environment Variables
   - Add/Update: `FRONTEND_URL=https://steadyletters.vercel.app`
   - Redeploy backend

---

## Option 2: Deploy via Vercel CLI

### Install Vercel CLI

```bash
npm install -g vercel
```

### Deploy Frontend

```bash
cd /Users/isaiahdupree/Documents/Software/KindLetters
vercel
# Follow prompts to link project
vercel --prod
```

### Deploy Backend

```bash
cd kindletters-backend
vercel
# Follow prompts:
# - Create new project
# - Root directory: kindletters-backend
vercel --prod
```

### Set Environment Variables via CLI

```bash
# Frontend
cd /Users/isaiahdupree/Documents/Software/KindLetters
vercel env add NEXT_PUBLIC_BACKEND_URL production
# Paste backend URL when prompted

# Backend
cd kindletters-backend
vercel env add FRONTEND_URL production
# Paste frontend URL when prompted
```

---

## Environment Variables

### Frontend Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

```bash
# Backend URL (set after backend deployment)
NEXT_PUBLIC_BACKEND_URL=https://your-backend.vercel.app

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Application
NEXT_PUBLIC_URL=https://your-frontend.vercel.app

# Stripe (public keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID=price_...

# Database (for Prisma)
DATABASE_URL=postgresql://...
```

### Backend Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

```bash
# Server
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Database
DATABASE_URL=postgresql://...

# OpenAI
OPENAI_API_KEY=sk-proj-...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_BUSINESS_PRICE_ID=price_...

# Thanks.io
THANKS_IO_API_KEY=...

# Application
NEXT_PUBLIC_URL=https://your-frontend.vercel.app
```

**Important**: For each variable, select all environments:
- ✅ Production
- ✅ Preview
- ✅ Development

---

## Post-Deployment Checklist

- [ ] Frontend deployed and accessible
- [ ] Backend deployed and accessible
- [ ] Frontend's `NEXT_PUBLIC_BACKEND_URL` points to backend
- [ ] Backend's `FRONTEND_URL` points to frontend
- [ ] Test health endpoint: `https://your-backend.vercel.app/api/health`
- [ ] Test frontend: Visit frontend URL
- [ ] Test API calls from frontend (check browser Network tab)
- [ ] Configure Stripe webhook: `https://your-backend.vercel.app/api/stripe/webhook`

---

## Stripe Webhook Configuration

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click **"Add endpoint"**
3. Enter URL: `https://your-backend.vercel.app/api/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy **Signing secret**
6. Add to backend environment variables as `STRIPE_WEBHOOK_SECRET`

---

## Troubleshooting

### Build Fails

- Check build logs in Vercel dashboard
- Verify all dependencies in `package.json`
- Check TypeScript errors
- Verify Prisma schema is valid

### API Calls Fail

- Verify `NEXT_PUBLIC_BACKEND_URL` is set correctly
- Check backend CORS configuration
- Verify backend is deployed and accessible
- Check browser console for errors

### 500 Errors

- Check Vercel function logs
- Verify all environment variables are set
- Check database connection
- Verify API keys are valid

---

## Quick Links

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Vercel Documentation](https://vercel.com/docs)
- [Full Deployment Guide](./VERCEL_DEPLOYMENT_GUIDE.md)

---

**Ready to deploy!** 🚀

