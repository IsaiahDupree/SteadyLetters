# Deployment Checklist

Use this checklist to ensure a smooth deployment of the frontend/backend split.

## Pre-Deployment

### Backend Setup
- [ ] All environment variables configured (see `ENVIRONMENT_SETUP.md`)
- [ ] Database migrations run: `cd kindletters-backend && npx prisma migrate deploy`
- [ ] Backend builds successfully: `cd kindletters-backend && npm run build`
- [ ] Backend starts locally: `cd kindletters-backend && npm run dev`
- [ ] Health check works: `curl http://localhost:3001/api/health`

### Frontend Setup
- [ ] All environment variables configured (see `ENVIRONMENT_SETUP.md`)
- [ ] `NEXT_PUBLIC_BACKEND_URL` points to backend (local or production)
- [ ] Frontend builds successfully: `npm run build`
- [ ] Frontend starts locally: `npm run dev`
- [ ] Integration test passes: `npm run test:integration`

### Testing
- [ ] Test authentication flow (sign up, sign in)
- [ ] Test letter generation
- [ ] Test voice transcription
- [ ] Test image analysis
- [ ] Test address extraction
- [ ] Test billing/usage page
- [ ] Test Stripe checkout (use test mode)
- [ ] Test Stripe portal access
- [ ] Test order creation
- [ ] Test Thanks.io product listing (if applicable)

## Backend Deployment

### Choose Platform
- [ ] Railway selected
- [ ] Render selected
- [ ] Heroku selected
- [ ] Other platform: _______________

### Deploy Steps
- [ ] Repository connected to platform
- [ ] Root directory set to `kindletters-backend`
- [ ] Build command: `npm install && npm run build`
- [ ] Start command: `npm start`
- [ ] Port configured (usually auto-set)
- [ ] All environment variables added
- [ ] `NODE_ENV=production` set
- [ ] `FRONTEND_URL` set to production frontend URL
- [ ] Database connection string verified
- [ ] Deployed successfully
- [ ] Backend URL obtained: _______________

### Post-Deployment Verification
- [ ] Health check works: `curl https://your-backend-url/api/health`
- [ ] CORS allows frontend domain
- [ ] Logs accessible and showing no errors

## Frontend Deployment (Vercel)

### Deploy Steps
- [ ] Repository connected to Vercel
- [ ] Root directory: `/` (not kindletters-backend)
- [ ] Framework preset: Next.js
- [ ] Build command: `npm run build` (default)
- [ ] Output directory: `.next` (default)
- [ ] All environment variables added
- [ ] `NEXT_PUBLIC_BACKEND_URL` set to backend URL
- [ ] Deployed successfully
- [ ] Frontend URL obtained: _______________

### Post-Deployment Verification
- [ ] Frontend loads correctly
- [ ] No console errors in browser
- [ ] API calls go to backend (check Network tab)
- [ ] Authentication works
- [ ] CORS errors resolved

## Stripe Webhook Configuration

### Setup
- [ ] Stripe account in production mode
- [ ] Webhook endpoint created: `https://your-backend-url/api/stripe/webhook`
- [ ] Webhook secret obtained
- [ ] `STRIPE_WEBHOOK_SECRET` added to backend environment
- [ ] Events selected:
  - [ ] `checkout.session.completed`
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`
- [ ] Test webhook sent and verified
- [ ] Webhook logs checked in backend

## Database

### Verification
- [ ] Database accessible from hosting platform
- [ ] Migrations applied: `npx prisma migrate deploy`
- [ ] Connection string correct
- [ ] Test query works
- [ ] User data accessible

## Security

### Checklist
- [ ] All secrets in environment variables (not in code)
- [ ] `STRIPE_SECRET_KEY` only in backend
- [ ] `STRIPE_WEBHOOK_SECRET` only in backend
- [ ] `OPENAI_API_KEY` only in backend
- [ ] `DATABASE_URL` only in backend
- [ ] CORS configured to only allow frontend domain
- [ ] HTTPS enabled for both services
- [ ] No sensitive data in logs

## Post-Deployment Testing

### Functional Tests
- [ ] Sign up new user
- [ ] Sign in existing user
- [ ] Generate letter
- [ ] Transcribe voice
- [ ] Analyze image
- [ ] Extract address
- [ ] View billing/usage
- [ ] Create Stripe checkout session
- [ ] Access Stripe portal
- [ ] Create order
- [ ] View orders

### Error Handling
- [ ] 401 errors display correctly
- [ ] 403 errors display correctly
- [ ] 500 errors handled gracefully
- [ ] Network errors handled
- [ ] Timeout errors handled

### Performance
- [ ] API response times acceptable
- [ ] No memory leaks
- [ ] Database queries optimized
- [ ] File uploads work correctly

## Monitoring

### Setup
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Log aggregation set up
- [ ] Uptime monitoring configured
- [ ] Performance monitoring configured
- [ ] Alert notifications configured

### Monitoring Points
- [ ] Backend uptime
- [ ] Frontend uptime
- [ ] API response times
- [ ] Error rates
- [ ] Database connection health
- [ ] Stripe webhook success rate

## Rollback Plan

### Preparation
- [ ] Previous deployment tagged/versioned
- [ ] Database backup created
- [ ] Environment variables documented
- [ ] Rollback procedure documented

### Rollback Steps (if needed)
1. [ ] Identify issue
2. [ ] Decide to rollback
3. [ ] Rollback backend (platform-specific)
4. [ ] Rollback frontend (Vercel dashboard)
5. [ ] Verify functionality
6. [ ] Document issue and resolution

## Documentation

### Update
- [ ] README updated with new architecture
- [ ] API documentation updated
- [ ] Deployment guide reviewed
- [ ] Environment setup guide reviewed
- [ ] Team notified of changes

## Final Verification

### End-to-End Test
- [ ] Complete user flow works:
  1. [ ] Sign up
  2. [ ] Generate letter
  3. [ ] Add image
  4. [ ] Create order
  5. [ ] View billing
  6. [ ] Upgrade plan (test mode)
  7. [ ] Send mail (if Thanks.io configured)

### Sign-Off
- [ ] All critical features working
- [ ] No blocking issues
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Monitoring active
- [ ] Team notified
- [ ] **Ready for production** ✅

## Notes

Add any deployment-specific notes here:

```
Date: _______________
Deployed by: _______________
Backend URL: _______________
Frontend URL: _______________
Issues encountered: _______________
Resolution: _______________
```

