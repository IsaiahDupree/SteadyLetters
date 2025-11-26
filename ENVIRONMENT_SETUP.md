# Environment Variables Setup Guide

This guide explains how to set up environment variables for both the frontend and backend projects after the split.

## Backend Environment Variables

Create a `.env` file in the `kindletters-backend/` directory:

```bash
# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Database
DATABASE_URL=your_postgres_connection_string

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PRO_PRICE_ID=price_xxxxx
STRIPE_BUSINESS_PRICE_ID=price_xxxxx

# Application URLs (for redirects)
NEXT_PUBLIC_URL=http://localhost:3000
```

### Getting Your Values

1. **Supabase**: 
   - Go to your Supabase project dashboard
   - Settings → API
   - Copy the Project URL and anon/public key

2. **Database URL**:
   - Same Supabase project → Settings → Database
   - Copy the connection string (use the "URI" format)

3. **OpenAI API Key**:
   - Go to https://platform.openai.com/api-keys
   - Create a new API key

4. **Stripe Keys**:
   - Go to https://dashboard.stripe.com/apikeys
   - Copy your Secret key
   - Go to Products → Pricing to get Price IDs

## Frontend Environment Variables

Create a `.env.local` file in the root directory (next to `package.json`):

```bash
# Backend API URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Application URL
NEXT_PUBLIC_URL=http://localhost:3000

# Stripe Price IDs (for pricing page)
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_xxxxx
NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID=price_xxxxx
```

## Production Environment Variables

### Backend (Vercel/Railway/Heroku/etc.)

Set these in your hosting platform's environment variables:

```bash
PORT=3001
FRONTEND_URL=https://www.steadyletters.com
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_key
DATABASE_URL=your_production_database_url
OPENAI_API_KEY=your_openai_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PRO_PRICE_ID=price_xxxxx
STRIPE_BUSINESS_PRICE_ID=price_xxxxx
NEXT_PUBLIC_URL=https://www.steadyletters.com
```

### Frontend (Vercel)

Set these in Vercel project settings:

```bash
NEXT_PUBLIC_BACKEND_URL=https://api.steadyletters.com
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_key
NEXT_PUBLIC_URL=https://www.steadyletters.com
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_xxxxx
NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID=price_xxxxx
```

## Quick Setup Script

You can create a setup script to copy environment variables:

```bash
#!/bin/bash
# setup-env.sh

# Copy example env files if they don't exist
if [ ! -f kindletters-backend/.env ]; then
    cp kindletters-backend/.env.example kindletters-backend/.env
    echo "Created kindletters-backend/.env - please fill in your values"
fi

if [ ! -f .env.local ]; then
    cp .env.example .env.local
    echo "Created .env.local - please fill in your values"
fi
```

## Verification

After setting up environment variables:

1. **Backend**: 
   ```bash
   cd kindletters-backend
   npm run dev
   # Should start on http://localhost:3001
   # Test: curl http://localhost:3001/api/health
   ```

2. **Frontend**:
   ```bash
   npm run dev
   # Should start on http://localhost:3000
   # Should connect to backend at http://localhost:3001
   ```

## Troubleshooting

### Backend can't connect to database
- Check `DATABASE_URL` is correct
- Ensure database is accessible from your network
- Run `npx prisma migrate dev` to set up schema

### Frontend can't reach backend
- Check `NEXT_PUBLIC_BACKEND_URL` is set correctly
- Ensure backend is running on the specified port
- Check CORS settings in backend (should allow frontend URL)

### Authentication not working
- Verify Supabase URLs and keys match in both frontend and backend
- Check that cookies are being sent (credentials: 'include' in fetch)

### Stripe checkout not working
- Verify `STRIPE_SECRET_KEY` is set in backend
- Check Price IDs are correct
- Ensure `NEXT_PUBLIC_URL` is set for redirect URLs

