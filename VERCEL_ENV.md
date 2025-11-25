# Production Environment Variables for Vercel

**⚠️ DO NOT COMMIT THIS FILE TO GIT - For reference only**

Copy these to Vercel Dashboard → Project Settings → Environment Variables

```bash
# Database
DATABASE_URL=<your-supabase-connection-string>

# Supabase
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>

# Thanks.io
THANKS_IO_API_KEY=<your-thanks-io-key>

# OpenAI
OPENAI_API_KEY=<your-openai-key>

# Stripe (LIVE KEYS)
STRIPE_SECRET_KEY=<sk_live_...>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<pk_live_...>
STRIPE_WEBHOOK_SECRET=<whsec_...>
STRIPE_PRO_PRICE_ID=price_1SXB2mBF0wJEbOgNbPR4dZhv
STRIPE_BUSINESS_PRICE_ID=price_1SXB2ZBF0wJEbOgNhEsphHHN

# App URL
NEXT_PUBLIC_URL=https://steadyletters.com
```

## How to Add in Vercel

1. Go to your project in Vercel
2. Click "Settings"
3. Click "Environment Variables"
4. For each variable:
   - Name: (e.g., `DATABASE_URL`)
   - Value: (paste YOUR actual value - see your local `.env` file)
   - Environment: Select "Production"
   - Click "Save"

## Important Notes

- ⚠️ These are LIVE keys - they will charge real cards!
- 🔒 Never commit API keys to git
- 🔄 After adding all variables, redeploy the project
- ✅ Verify webhook secret matches Stripe Dashboard
- 📋 Get actual values from your local `.env` file (NOT committed to git)
