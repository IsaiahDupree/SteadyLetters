# 🚀 Quick Deploy Guide - SteadyLetters

## Current Status
- ✅ Project exists on Vercel: `steadyletters`
- ✅ Connected to GitHub: `IsaiahDupree/SteadyLetters`
- ✅ Build configuration ready (`vercel.json`)
- ❌ **Environment variables missing** - This is why the last deployment failed

## ⚡ Quick Steps to Deploy

### Step 1: Add Environment Variables in Vercel

**Go to:** https://vercel.com/isaiahduprees-projects/steadyletters/settings/environment-variables

Add these **10 environment variables** (get values from your local `.env` file):

#### Required Variables:

1. **DATABASE_URL**
   - Your Supabase PostgreSQL connection string
   - Format: `postgresql://postgres.xxxxx.supabase.co:5432/postgres?pgbouncer=true`

2. **NEXT_PUBLIC_SUPABASE_URL**
   - Your Supabase project URL
   - Format: `https://xxxxx.supabase.co`

3. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Your Supabase anonymous key
   - Format: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

4. **THANKS_IO_API_KEY**
   - Your Thanks.io API key for physical letter delivery

5. **OPENAI_API_KEY**
   - Your OpenAI API key
   - Format: `sk-proj-...`

6. **STRIPE_SECRET_KEY**
   - Your Stripe secret key (LIVE mode)
   - Format: `sk_live_...`

7. **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY**
   - Your Stripe publishable key (LIVE mode)
   - Format: `pk_live_...`

8. **STRIPE_WEBHOOK_SECRET**
   - Your Stripe webhook secret
   - Format: `whsec_...`

9. **STRIPE_PRO_PRICE_ID**
   - Value: `price_1SXB2mBF0wJEbOgNbPR4dZhv`

10. **STRIPE_BUSINESS_PRICE_ID**
    - Value: `price_1SXB2ZBF0wJEbOgNhEsphHHN`

11. **NEXT_PUBLIC_URL**
    - Value: `https://steadyletters.com`

### Step 2: Configure Environment Scope

For each variable, select:
- ✅ **Production**
- ✅ **Preview** 
- ✅ **Development**

This ensures all deployments have access to the variables.

### Step 3: Trigger Deployment

After adding all variables, you have two options:

**Option A: Automatic (Recommended)**
- Push any commit to the `main` branch
- Vercel will automatically deploy

**Option B: Manual Redeploy**
- Go to: https://vercel.com/isaiahduprees-projects/steadyletters
- Click "Deployments" tab
- Click the three dots on the latest deployment
- Click "Redeploy"

### Step 4: Verify Deployment

Once deployed, check:
- ✅ Build logs show no errors
- ✅ Deployment status is "Ready"
- ✅ Visit the deployment URL to test

### Step 5: Add Custom Domain (Optional)

1. Go to: https://vercel.com/isaiahduprees-projects/steadyletters/settings/domains
2. Add `steadyletters.com`
3. Follow DNS configuration instructions shown

---

## 🔗 Quick Links

- **Project Dashboard:** https://vercel.com/isaiahduprees-projects/steadyletters
- **Environment Variables:** https://vercel.com/isaiahduprees-projects/steadyletters/settings/environment-variables
- **Deployments:** https://vercel.com/isaiahduprees-projects/steadyletters/deployments
- **Settings:** https://vercel.com/isaiahduprees-projects/steadyletters/settings

---

## ⚠️ Important Notes

- **Never commit** your `.env` file to git
- Use **LIVE Stripe keys** (not test keys) for production
- The `DATABASE_URL` must be accessible from Vercel's servers
- After adding variables, wait 1-2 minutes before redeploying

---

## 🐛 Troubleshooting

**Build fails with "Missing DATABASE_URL"**
- ✅ Make sure you added `DATABASE_URL` in Vercel
- ✅ Check that it's enabled for "Production" environment
- ✅ Verify the connection string is correct

**Build fails with Prisma errors**
- ✅ Ensure `DATABASE_URL` is set correctly
- ✅ Check that your Supabase database is accessible

**Deployment succeeds but app doesn't work**
- ✅ Check that all `NEXT_PUBLIC_*` variables are set
- ✅ Verify Stripe keys are LIVE mode keys
- ✅ Check browser console for errors

