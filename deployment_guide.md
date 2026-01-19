# Deployment Guide for Frontend/Backend Split

This guide covers deployment considerations for the split frontend and backend architecture.

## Architecture Overview

- **Frontend**: Next.js application (deployed to Vercel)
- **Backend**: Express.js API server (deployed to Railway, Render, or similar)

## Prerequisites

1. Both projects have their dependencies installed
2. Environment variables are configured (see `ENVIRONMENT_SETUP.md`)
3. Database migrations are run
4. Both services are tested locally

## Backend Deployment

### Option 1: Railway (Recommended)

1. **Create Railway Project**
   ```bash
   # Install Railway CLI
   npm i -g @railway/cli
   
   # Login
   railway login
   
   # Initialize project
   cd kindletters-backend
   railway init
   ```

2. **Configure Environment Variables**
   - Go to Railway dashboard → Project → Variables
   - Add all variables from `ENVIRONMENT_SETUP.md`
   - Set `NODE_ENV=production`
   - Set `FRONTEND_URL=https://www.steadyletters.com` (your frontend URL)

3. **Deploy**
   ```bash
   railway up
   ```

4. **Get Backend URL**
   - Railway will provide a URL like `https://your-app.railway.app`
   - Update frontend environment variable: `NEXT_PUBLIC_BACKEND_URL`

### Option 2: Render

1. **Create Web Service**
   - Go to Render dashboard
   - New → Web Service
   - Connect your repository
   - Set root directory: `kindletters-backend`

2. **Build Settings**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

3. **Environment Variables**
   - Add all variables from `ENVIRONMENT_SETUP.md`
   - Set `NODE_ENV=production`
   - Set `FRONTEND_URL=https://www.steadyletters.com`

4. **Deploy**
   - Render will auto-deploy on push to main branch

### Option 3: Heroku

1. **Create Heroku App**
   ```bash
   cd kindletters-backend
   heroku create kindletters-backend
   ```

2. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set FRONTEND_URL=https://www.steadyletters.com
   # Add all other variables
   ```

3. **Deploy**
   ```bash
   git push heroku main
   ```

## Frontend Deployment (Vercel)

1. **Connect Repository**
   - Go to Vercel dashboard
   - Import your repository
   - Select the root directory (not kindletters-backend)

2. **Environment Variables**
   - Add `NEXT_PUBLIC_BACKEND_URL` (your backend URL)
   - Add all other `NEXT_PUBLIC_*` variables
   - **Do NOT** add backend-only variables (like `STRIPE_SECRET_KEY`)

3. **Build Settings**
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`

4. **Deploy**
   - Vercel will auto-deploy on push to main branch

## Stripe Webhook Configuration

### Important: Webhook URL

The Stripe webhook must point to your **backend URL**, not the frontend:

```
https://your-backend-url.railway.app/api/stripe/webhook
```

### Setup Steps

1. **Get Backend Webhook URL**
   - After deploying backend, get the URL
   - Webhook endpoint: `https://your-backend-url/api/stripe/webhook`

2. **Configure in Stripe Dashboard**
   - Go to Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://your-backend-url/api/stripe/webhook`
   - Select events:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`

3. **Get Webhook Secret**
   - After creating webhook, copy the signing secret
   - Add to backend environment: `STRIPE_WEBHOOK_SECRET`

4. **Test Webhook**
   - Use Stripe CLI: `stripe listen --forward-to localhost:3001/api/stripe/webhook`
   - Or use Stripe dashboard test webhook feature

## CORS Configuration

The backend must allow requests from your frontend domain:

```typescript
// In kindletters-backend/src/index.ts
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));
```

**Production**: Set `FRONTEND_URL=https://www.steadyletters.com`

## Database Considerations

### Shared Database

Both frontend and backend can use the same Supabase database:
- Frontend: Uses Prisma client for direct queries (if needed)
- Backend: Uses Prisma client for all database operations

### Migrations

Run migrations on the backend:
```bash
cd kindletters-backend
npx prisma migrate deploy
```

## Environment Variables Checklist

### Backend (.env)
- [ ] `PORT` (usually auto-set by hosting platform)
- [ ] `FRONTEND_URL` (your frontend domain)
- [ ] `NODE_ENV=production`
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `DATABASE_URL`
- [ ] `OPENAI_API_KEY`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `STRIPE_PRO_PRICE_ID`
- [ ] `STRIPE_BUSINESS_PRICE_ID`
- [ ] `NEXT_PUBLIC_URL` (for redirects)

### Frontend (Vercel Environment Variables)
- [ ] `NEXT_PUBLIC_BACKEND_URL` (your backend URL)
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `NEXT_PUBLIC_URL`
- [ ] `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID`
- [ ] `NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID`

## Testing Deployment

1. **Test Backend Health**
   ```bash
   curl https://your-backend-url/api/health
   ```

2. **Test Frontend → Backend**
   - Open frontend in browser
   - Check browser console for API errors
   - Verify API calls go to backend URL

3. **Test Authentication**
   - Sign in on frontend
   - Verify cookies are sent to backend
   - Check backend logs for auth requests

4. **Test Stripe Webhook**
   - Use Stripe dashboard to send test webhook
   - Check backend logs for webhook processing
   - Verify database updates

## Monitoring

### Backend Logs
- Railway: Dashboard → Deployments → View Logs
- Render: Dashboard → Service → Logs
- Heroku: `heroku logs --tail`

### Frontend Logs
- Vercel: Dashboard → Deployment → Functions → View Logs

### Error Tracking
Consider adding:
- Sentry for error tracking
- LogRocket for session replay
- Datadog for monitoring

## Rollback Plan

### Backend
```bash
# Railway
railway rollback

# Render
Dashboard → Deployments → Rollback

# Heroku
heroku rollback
```

### Frontend
- Vercel: Dashboard → Deployments → Three dots → Promote to Production

## Troubleshooting

### Issue: CORS Errors
**Solution**: Verify `FRONTEND_URL` in backend matches frontend domain exactly

### Issue: 401 Unauthorized
**Solution**: 
- Check Supabase credentials match in both services
- Verify cookies are being sent (check browser DevTools)
- Check backend auth middleware logs

### Issue: Webhook Not Working
**Solution**:
- Verify webhook URL points to backend, not frontend
- Check `STRIPE_WEBHOOK_SECRET` is set correctly
- Verify webhook signature verification in backend logs

### Issue: Database Connection Errors
**Solution**:
- Verify `DATABASE_URL` is correct
- Check database is accessible from hosting platform
- Run migrations: `npx prisma migrate deploy`

## Security Checklist

- [ ] All secrets are in environment variables (not in code)
- [ ] `STRIPE_SECRET_KEY` only in backend
- [ ] `STRIPE_WEBHOOK_SECRET` only in backend
- [ ] CORS configured to only allow frontend domain
- [ ] Database connection string is secure
- [ ] API keys are rotated regularly
- [ ] HTTPS enabled for both services

## Next Steps

1. Deploy backend to chosen platform
2. Update frontend environment variables with backend URL
3. Deploy frontend to Vercel
4. Configure Stripe webhook
5. Test all functionality
6. Monitor logs for errors
7. Set up error tracking (optional but recommended)
