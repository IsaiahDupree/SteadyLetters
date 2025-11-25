# Post-Deploy Hook Setup Guide

## Overview

This project includes comprehensive post-deploy testing that runs automatically after each deployment to catch production issues early.

## Components

### 1. Settings Page Test Runner (`/settings`)
- **Location**: Accessible from navbar when signed in
- **Features**:
  - Tests all API endpoints
  - Tests public pages
  - Validates environment variables
  - Tests database connection
  - Shows detailed results with logs and errors

### 2. Post-Deploy Script (`scripts/post-deploy-tests.mjs`)
- **Manual Run**: `npm run test:post-deploy`
- **Automatic**: Can be configured in Vercel

### 3. Vercel Serverless Function (`api/post-deploy.js`)
- **Purpose**: Webhook endpoint for Vercel to call after deployment
- **URL**: `https://www.steadyletters.com/api/post-deploy`

## Setting Up Vercel Post-Deploy Hook

### Option 1: Vercel Dashboard (Recommended)

1. Go to Vercel Dashboard → Your Project → Settings → Git
2. Scroll to "Deploy Hooks"
3. Click "Create Hook"
4. Name: "Post-Deploy Tests"
5. URL: `https://www.steadyletters.com/api/post-deploy`
6. Events: Select "Deployment"
7. Save

### Option 2: Vercel CLI

```bash
vercel env add POST_DEPLOY_WEBHOOK_URL
# Enter: https://www.steadyletters.com/api/post-deploy
```

### Option 3: GitHub Actions (Alternative)

Create `.github/workflows/post-deploy.yml`:

```yaml
name: Post-Deploy Tests
on:
  deployment_status:
    types: [success]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:post-deploy
        env:
          PRODUCTION_URL: ${{ github.event.deployment_status.target_url }}
```

## Test Coverage

### API Endpoints (15+)
- Health Check
- Auth Sync User
- Billing Usage
- Transcribe
- Analyze Image
- Generate Letter
- Generate Card Image
- Generate Images
- Extract Address
- Orders (GET, POST)
- Thanks.io Products
- Thanks.io Styles
- Thanks.io Send
- Stripe Checkout
- Stripe Portal
- Handwriting Styles

### Public Pages
- Homepage
- Pricing
- Login
- Signup

### Infrastructure
- Environment Variables
- Database Connection

## Viewing Results

### From Settings Page
1. Sign in to the application
2. Navigate to Settings (in navbar)
3. Click "Run Production Tests"
4. View detailed results with logs and errors

### From Vercel Logs
1. Go to Vercel Dashboard → Your Project → Functions
2. Check `/api/post-deploy` function logs
3. View test results and any failures

### From Command Line
```bash
npm run test:post-deploy
```

## Troubleshooting

### Tests Failing After Deployment

1. **Check Settings Page**: Go to `/settings` and run tests manually
2. **Check Vercel Logs**: Look for detailed error messages
3. **Common Issues**:
   - Missing environment variables
   - Database connection issues
   - Authentication cookie problems
   - API endpoint changes

### Post-Deploy Hook Not Running

1. Verify webhook URL is correct
2. Check Vercel deployment logs
3. Ensure function is deployed: `vercel deploy --prod`
4. Test manually: `curl -X POST https://www.steadyletters.com/api/post-deploy`

## Manual Testing

Run tests manually anytime:

```bash
# Test production
PRODUCTION_URL=https://www.steadyletters.com npm run test:post-deploy

# Test preview deployment
PRODUCTION_URL=https://your-preview-url.vercel.app npm run test:post-deploy
```

