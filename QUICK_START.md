# Quick Start Guide

Get the frontend and backend running locally in minutes.

## Prerequisites

- Node.js 18+ installed
- npm or yarn installed
- Supabase account (for authentication)
- OpenAI API key (for AI features)
- Stripe account (for payments, optional for testing)

## Step 1: Clone and Install

```bash
# You're already in the project directory
cd /Users/isaiahdupree/Documents/Software/KindLetters
```

## Step 2: Backend Setup

```bash
# Navigate to backend
cd kindletters-backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_database_url
OPENAI_API_KEY=your_openai_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
STRIPE_PRO_PRICE_ID=price_xxxxx
STRIPE_BUSINESS_PRICE_ID=price_xxxxx
NEXT_PUBLIC_URL=http://localhost:3000
THANKS_IO_API_KEY=your_thanks_io_key
EOF

# Run database migrations
npx prisma migrate dev

# Start backend server
npm run dev
```

Backend should now be running on `http://localhost:3001`

## Step 3: Frontend Setup

Open a new terminal:

```bash
# Navigate to project root
cd /Users/isaiahdupree/Documents/Software/KindLetters

# Install dependencies (if not already done)
npm install

# Create .env.local file
cat > .env.local << EOF
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_xxxxx
NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID=price_xxxxx
EOF

# Start frontend server
npm run dev
```

Frontend should now be running on `http://localhost:3000`

## Step 4: Verify Setup

### Test Backend
```bash
curl http://localhost:3001/api/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "...",
  "service": "kindletters-backend",
  "environment": "development"
}
```

### Test Integration
```bash
npm run test:integration
```

### Test in Browser
1. Open `http://localhost:3000`
2. Sign up or sign in
3. Try generating a letter
4. Check browser console for any errors
5. Check Network tab - API calls should go to `http://localhost:3001`

## Troubleshooting

### Backend won't start
- Check if port 3001 is available: `lsof -i :3001`
- Verify all environment variables are set
- Check database connection: `npx prisma db pull`

### Frontend can't reach backend
- Verify `NEXT_PUBLIC_BACKEND_URL=http://localhost:3001` in `.env.local`
- Check backend is running
- Check CORS settings in backend

### Authentication not working
- Verify Supabase credentials match in both `.env` files
- Check browser cookies are being set
- Check backend logs for auth errors

### Database errors
- Run migrations: `cd kindletters-backend && npx prisma migrate dev`
- Check `DATABASE_URL` is correct
- Verify database is accessible

## Next Steps

1. ✅ Both servers running
2. ✅ Integration test passing
3. 📖 Read `DEPLOYMENT_GUIDE.md` for production deployment
4. 📋 Use `DEPLOYMENT_CHECKLIST.md` when deploying
5. 🧪 Test all features before deploying

## Development Workflow

### Making Changes

**Backend Changes:**
```bash
cd kindletters-backend
# Make changes
npm run dev  # Auto-reloads
```

**Frontend Changes:**
```bash
# In project root
# Make changes
npm run dev  # Auto-reloads
```

### Testing
```bash
# Run integration tests
npm run test:integration

# Run unit tests
npm test

# Run E2E tests
npm run test:e2e
```

## Common Commands

```bash
# Backend
cd kindletters-backend
npm run dev      # Start dev server
npm run build    # Build for production
npm start        # Start production server

# Frontend
npm run dev      # Start dev server
npm run build    # Build for production
npm start        # Start production server

# Database
cd kindletters-backend
npx prisma migrate dev    # Create and apply migration
npx prisma studio         # Open database GUI
npx prisma generate       # Generate Prisma client
```

## Need Help?

- Check `ENVIRONMENT_SETUP.md` for environment variable details
- Check `TESTING_GUIDE_SPLIT.md` for testing help
- Check `DEPLOYMENT_GUIDE.md` for deployment help
- Check `FRONTEND_BACKEND_SPLIT.md` for architecture overview

