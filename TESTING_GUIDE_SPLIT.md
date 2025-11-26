# Testing Guide for Frontend/Backend Split

This guide explains how to test the integration between the frontend and backend after the split.

## Prerequisites

1. Both projects have their dependencies installed
2. Environment variables are configured (see `ENVIRONMENT_SETUP.md`)
3. Database migrations are run: `cd kindletters-backend && npx prisma migrate dev`

## Starting Both Services

### Terminal 1 - Backend
```bash
cd kindletters-backend
npm run dev
# Should start on http://localhost:3001
```

### Terminal 2 - Frontend
```bash
npm run dev
# Should start on http://localhost:3000
```

## Testing Checklist

### 1. Health Check
- [ ] Backend health endpoint works: `curl http://localhost:3001/api/health`
- [ ] Returns JSON with status: "ok"

### 2. Authentication Flow
- [ ] Sign up a new user in frontend
- [ ] Sign in with existing user
- [ ] Verify cookies are set correctly
- [ ] Check backend receives auth token in requests

### 3. API Endpoints

#### Letter Generation
- [ ] Navigate to letter generation page
- [ ] Fill in context and generate letter
- [ ] Verify request goes to backend (`/api/generate/letter`)
- [ ] Check response contains generated letter

#### Voice Transcription
- [ ] Use voice recorder component
- [ ] Record audio and transcribe
- [ ] Verify request goes to backend (`/api/transcribe`)
- [ ] Check transcription appears correctly

#### Image Analysis
- [ ] Upload an image
- [ ] Click "Analyze Image"
- [ ] Verify request goes to backend (`/api/analyze-image`)
- [ ] Check analysis appears correctly

#### Billing/Usage
- [ ] Navigate to billing page
- [ ] Verify usage data loads from backend (`/api/billing/usage`)
- [ ] Check usage stats display correctly

#### Stripe Checkout
- [ ] Navigate to pricing page
- [ ] Click "Select Plan" on PRO or BUSINESS
- [ ] Verify checkout session created via backend (`/api/stripe/checkout`)
- [ ] Check redirect to Stripe works

#### Orders
- [ ] Create an order (if applicable)
- [ ] View orders list
- [ ] Verify requests go to backend (`/api/orders`)

### 4. Error Handling
- [ ] Test with invalid authentication (should return 401)
- [ ] Test with missing required fields (should return 400)
- [ ] Test with rate limit exceeded (should return 403)
- [ ] Verify error messages display in frontend

### 5. CORS Configuration
- [ ] Verify frontend can make requests to backend
- [ ] Check browser console for CORS errors
- [ ] Verify credentials (cookies) are sent with requests

## Manual Testing Scripts

### Test Backend Health
```bash
curl http://localhost:3001/api/health
```

### Test Authenticated Endpoint (requires auth token)
```bash
# First, get auth token from browser cookies after logging in
# Then test:
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     http://localhost:3001/api/billing/usage
```

### Test with Browser DevTools
1. Open browser DevTools (F12)
2. Go to Network tab
3. Perform actions in frontend
4. Verify requests go to `http://localhost:3001/api/...`
5. Check request/response headers and bodies

## Common Issues

### Issue: CORS Errors
**Solution**: 
- Check `FRONTEND_URL` in backend `.env` matches frontend URL
- Verify CORS middleware is configured correctly in `kindletters-backend/src/index.ts`

### Issue: 401 Unauthorized
**Solution**:
- Check Supabase credentials are correct
- Verify cookies are being sent (check `credentials: 'include'` in fetch calls)
- Check authentication middleware in backend

### Issue: 404 Not Found
**Solution**:
- Verify route is registered in `kindletters-backend/src/index.ts`
- Check route path matches frontend API call
- Ensure backend server is running

### Issue: Database Connection Errors
**Solution**:
- Verify `DATABASE_URL` is correct in backend `.env`
- Run `npx prisma migrate dev` to ensure schema is up to date
- Check database is accessible

### Issue: Environment Variables Not Loading
**Solution**:
- Restart both servers after changing `.env` files
- Verify `.env` files are in correct locations
- Check variable names match exactly (case-sensitive)

## Automated Testing

### Backend Tests
```bash
cd kindletters-backend
npm test
```

### Frontend Tests
```bash
npm test
```

### E2E Tests
```bash
npm run test:e2e
```

## Performance Testing

1. **Response Times**: Check Network tab in DevTools for API response times
2. **Concurrent Requests**: Test multiple users making requests simultaneously
3. **Large File Uploads**: Test image/audio uploads with large files
4. **Rate Limiting**: Verify tier limits are enforced correctly

## Next Steps After Testing

1. Fix any issues found during testing
2. Update remaining routes/components
3. Set up production environment variables
4. Deploy backend to hosting platform
5. Deploy frontend with updated backend URL
6. Test production deployment

