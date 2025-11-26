# Vercel Deployment Guide - Frontend & Backend

This guide covers deploying both the frontend (Next.js) and backend (Express.js) to Vercel.

## Architecture

- **Frontend**: Next.js app → Deploy to Vercel (main project)
- **Backend**: Express.js API → Deploy to Vercel as separate project or serverless functions

## Option 1: Separate Vercel Projects (Recommended) ✅

Deploy frontend and backend as two separate Vercel projects. This is the cleanest approach.

### Frontend Deployment

1. **Connect Repository**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - **Root Directory**: Leave as root (or set to project root)
   - **Framework Preset**: Next.js (auto-detected)

2. **Environment Variables**
   Add these in Vercel Dashboard → Settings → Environment Variables:

   ```bash
   # Backend URL (will be set after backend deployment)
   NEXT_PUBLIC_BACKEND_URL=https://your-backend.vercel.app
   
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Application
   NEXT_PUBLIC_URL=https://your-frontend.vercel.app
   
   # Stripe (public keys only)
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_...
   NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID=price_...
   
   # Database (for Prisma)
   DATABASE_URL=your_database_url
   ```

3. **Build Settings**
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

4. **Deploy**
   - Push to `main` branch (auto-deploys)
   - Or manually deploy from Vercel dashboard

### Backend Deployment

1. **Create New Vercel Project**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New" → "Project"
   - Import the same GitHub repository
   - **Root Directory**: `kindletters-backend`
   - **Framework Preset**: Other

2. **Environment Variables**
   Add these in Vercel Dashboard → Settings → Environment Variables:

   ```bash
   # Server Configuration
   PORT=3001
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend.vercel.app
   
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Database
   DATABASE_URL=your_database_url
   
   # OpenAI
   OPENAI_API_KEY=sk-proj-...
   
   # Stripe
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PRO_PRICE_ID=price_...
   STRIPE_BUSINESS_PRICE_ID=price_...
   
   # Thanks.io
   THANKS_IO_API_KEY=your_thanks_io_key
   
   # Application URLs
   NEXT_PUBLIC_URL=https://your-frontend.vercel.app
   ```

3. **Build Settings**
   - Build Command: `npm install && npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Update vercel.json** (already created)
   The `kindletters-backend/vercel.json` file configures the Express app as serverless functions.

5. **Deploy**
   - Push to `main` branch (auto-deploys)
   - Get the backend URL from Vercel (e.g., `https://kindletters-backend.vercel.app`)
   - Update frontend's `NEXT_PUBLIC_BACKEND_URL` with this URL

6. **Configure Stripe Webhook**
   - Go to Stripe Dashboard → Webhooks
   - Add endpoint: `https://your-backend.vercel.app/api/stripe/webhook`
   - Copy webhook secret and add to backend environment variables

---

## Option 2: Single Project with Serverless Functions

Deploy backend as serverless functions in the same Vercel project as the frontend.

### Setup

1. **Update Root vercel.json**
   ```json
   {
     "buildCommand": "prisma generate && next build",
     "outputDirectory": ".next",
     "framework": "nextjs",
     "functions": {
       "kindletters-backend/src/index.ts": {
         "memory": 1024,
         "maxDuration": 30
       }
     },
     "rewrites": [
       {
         "source": "/api/backend/:path*",
         "destination": "/kindletters-backend/src/index.ts"
       }
     ]
   }
   ```

2. **Environment Variables**
   Add all variables from both frontend and backend to the same project.

3. **Update Frontend API Calls**
   Change `NEXT_PUBLIC_BACKEND_URL` to use relative paths:
   ```typescript
   // Instead of: http://localhost:3001/api/...
   // Use: /api/backend/api/...
   ```

**Note**: This approach is more complex and not recommended. Option 1 is cleaner.

---

## Quick Deploy Commands

### Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Frontend Deployment
cd /Users/isaiahdupree/Documents/Software/KindLetters
vercel --prod

# Backend Deployment
cd kindletters-backend
vercel --prod
```

### Environment Variables via CLI

```bash
# Frontend
cd /Users/isaiahdupree/Documents/Software/KindLetters
vercel env add NEXT_PUBLIC_BACKEND_URL production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# ... add all other variables

# Backend
cd kindletters-backend
vercel env add DATABASE_URL production
vercel env add OPENAI_API_KEY production
# ... add all other variables
```

---

## Deployment Checklist

### Before Deployment

- [ ] Both projects build successfully locally
- [ ] All tests pass
- [ ] Environment variables documented
- [ ] Database migrations applied
- [ ] Stripe webhook configured

### Frontend Deployment

- [ ] Repository connected to Vercel
- [ ] Root directory set correctly
- [ ] All `NEXT_PUBLIC_*` environment variables set
- [ ] `NEXT_PUBLIC_BACKEND_URL` points to backend URL
- [ ] Build succeeds
- [ ] Deployment is live

### Backend Deployment

- [ ] Separate Vercel project created
- [ ] Root directory set to `kindletters-backend`
- [ ] All environment variables set
- [ ] `FRONTEND_URL` points to frontend URL
- [ ] Build succeeds
- [ ] API endpoints accessible
- [ ] Stripe webhook URL updated

### After Deployment

- [ ] Frontend loads correctly
- [ ] API calls work (check Network tab)
- [ ] Authentication works
- [ ] Stripe checkout works
- [ ] Webhook receives events
- [ ] Database connections work

---

## Troubleshooting

### Frontend Can't Reach Backend

**Issue**: CORS errors or 404s when calling backend API

**Solutions**:
1. Verify `NEXT_PUBLIC_BACKEND_URL` is set correctly
2. Check backend CORS configuration allows frontend domain
3. Verify backend is deployed and accessible
4. Check browser console for errors

### Backend Returns 500 Errors

**Issue**: Backend API returns 500 Internal Server Error

**Solutions**:
1. Check Vercel function logs
2. Verify all environment variables are set
3. Check database connection string
4. Verify API keys are valid
5. Check function timeout settings (increase if needed)

### Build Fails

**Issue**: Vercel build fails

**Solutions**:
1. Check build logs for specific errors
2. Verify all dependencies are in `package.json`
3. Check TypeScript compilation errors
4. Verify Prisma schema is valid
5. Check Node.js version compatibility

### Stripe Webhook Not Working

**Issue**: Stripe webhooks not received

**Solutions**:
1. Verify webhook URL is correct: `https://your-backend.vercel.app/api/stripe/webhook`
2. Check webhook secret is set correctly
3. Verify webhook endpoint is accessible
4. Check Stripe dashboard for webhook delivery logs

---

## Environment Variables Reference

### Frontend (Next.js)

```bash
NEXT_PUBLIC_BACKEND_URL=https://your-backend.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_URL=https://your-frontend.vercel.app
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID=price_...
DATABASE_URL=postgresql://...  # For Prisma
```

### Backend (Express)

```bash
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-proj-...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_BUSINESS_PRICE_ID=price_...
THANKS_IO_API_KEY=...
NEXT_PUBLIC_URL=https://your-frontend.vercel.app
```

---

## Post-Deployment

1. **Test Frontend**
   - Visit your frontend URL
   - Test authentication
   - Test API calls

2. **Test Backend**
   - Visit `https://your-backend.vercel.app/api/health`
   - Should return: `{"status":"ok",...}`

3. **Test Integration**
   - Sign in on frontend
   - Make API calls
   - Check Network tab for successful requests

4. **Monitor**
   - Check Vercel logs for errors
   - Monitor Stripe webhook deliveries
   - Check database connections

---

## Quick Links

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel CLI Reference](https://vercel.com/docs/cli)

---

**Status**: Ready for deployment! 🚀

