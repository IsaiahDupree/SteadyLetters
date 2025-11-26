# Frontend/Backend Split

This document tracks the progress of splitting the KindLetters application into separate frontend and backend projects.

## Branches

- **backend** - Express.js backend API server
- **frontend** - Next.js frontend application

## Backend (Express.js)

### Location
`/kindletters-backend/`

### Setup
1. Install dependencies: `npm install`
2. Set environment variables in `.env`
3. Run migrations: `npx prisma migrate dev`
4. Start server: `npm run dev` (runs on port 3001)

### Completed Routes
- ✅ `/api/health` - Health check
- ✅ `/api/generate/letter` - Generate letter content
- ✅ `/api/generate/images` - Generate 4 card images
- ✅ `/api/generate/card-image` - Generate single card front image
- ✅ `/api/transcribe` - Transcribe audio files
- ✅ `/api/orders` - Order management (GET, POST, PATCH)
- ✅ `/api/billing/usage` - Get user usage and subscription data
- ✅ `/api/stripe/checkout` - Create Stripe checkout session
- ✅ `/api/stripe/portal` - Create Stripe customer portal session
- ✅ `/api/stripe/webhook` - Handle Stripe webhook events
- ✅ `/api/analyze-image` - Analyze images using GPT-4 Vision
- ✅ `/api/extract-address` - Extract return address from image
- ✅ `/api/auth/sync-user` - Sync Supabase user to Prisma
- ✅ `/api/handwriting-styles` - Get handwriting styles from Thanks.io
- ✅ `/api/thanks-io/products` - Get available Thanks.io products
- ✅ `/api/thanks-io/styles` - Get Thanks.io handwriting styles
- ✅ `/api/thanks-io/send` - Send mail via Thanks.io API

### Remaining Routes to Migrate
- ⏳ `/api/settings/return-address`
- ⏳ `/api/settings/run-tests`
- ⏳ `/api/analytics/orders`
- ⏳ `/api/post-deploy`
- ⏳ `/api/debug`
- ⏳ `/api/generate/images`
- ⏳ `/api/generate/card-image`
- ⏳ `/api/handwriting-styles`
- ⏳ `/api/billing/usage`
- ⏳ `/api/auth/sync-user`
- ⏳ `/api/stripe/checkout`
- ⏳ `/api/stripe/portal`
- ⏳ `/api/stripe/webhook`
- ⏳ `/api/thanks-io/products`
- ⏳ `/api/thanks-io/styles`
- ⏳ `/api/thanks-io/send`
- ⏳ `/api/settings/return-address`
- ⏳ `/api/settings/run-tests`
- ⏳ `/api/analytics/orders`
- ⏳ `/api/post-deploy`
- ⏳ `/api/debug`

## Frontend (Next.js)

### Location
`/src/`

### Configuration
- API base URL configured in `src/lib/api-config.ts`
- Defaults to `http://localhost:3001` in development
- Set `NEXT_PUBLIC_BACKEND_URL` environment variable for production

### Updated Components
- ✅ `src/components/voice-recorder.tsx` - Uses backend API for transcription
- ✅ `src/features/generate/letter-generator-form.tsx` - Uses backend API for letter generation
- ✅ `src/components/image-upload.tsx` - Uses backend API for image analysis
- ✅ `src/components/image-selector.tsx` - Uses backend API for image generation
- ✅ `src/components/address-extractor.tsx` - Uses backend API for address extraction
- ✅ `src/features/generate/enhanced-letter-result.tsx` - Uses backend API for card image generation
- ✅ `src/app/billing/page.tsx` - Uses backend API for usage data
- ✅ `src/app/pricing/page.tsx` - Uses backend API for Stripe checkout

### Components Still Using Next.js API Routes
- ⏳ `src/features/recipients/recipient-selector.tsx`
- ⏳ `src/app/settings/page.tsx`
- ⏳ `src/features/analytics/order-analytics.tsx`
- ⏳ `src/components/address-extractor.tsx`
- ⏳ `src/features/recipients/recipient-selector.tsx`
- ⏳ `src/app/billing/page.tsx`
- ⏳ `src/app/pricing/page.tsx`
- ⏳ `src/app/settings/page.tsx`
- ⏳ `src/features/analytics/order-analytics.tsx`

## Migration Strategy

### For Each Route:

1. **Backend (Express)**
   - Create route file in `kindletters-backend/src/routes/`
   - Convert Next.js route handler to Express router
   - Update imports to use Express types
   - Use `authenticateRequest` middleware for protected routes
   - Register route in `kindletters-backend/src/index.ts`

2. **Frontend (Next.js)**
   - Update component to use `apiRequest` or `apiRequestFormData` from `@/lib/api-config`
   - Replace `fetch('/api/...')` with `apiRequest('...')`
   - Update error handling if needed

### Example Migration

**Before (Next.js API Route):**
```typescript
// src/app/api/generate/letter/route.ts
export async function POST(request: NextRequest) {
    const user = await getAuthenticatedUser(request);
    // ... handler logic
}
```

**After (Express Route):**
```typescript
// kindletters-backend/src/routes/generate/letter.ts
router.post('/', authenticateRequest, async (req: Request, res: Response) => {
    const user = (req as any).user;
    // ... handler logic
});
```

**Frontend Update:**
```typescript
// Before
const response = await fetch('/api/generate/letter', { ... });

// After
const data = await apiRequest('generate/letter', { method: 'POST', ... });
```

## Environment Variables

### Backend (.env)
```
PORT=3001
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
OPENAI_API_KEY=...
DATABASE_URL=...
STRIPE_SECRET_KEY=...
```

### Frontend (.env.local)
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Testing

1. Start backend: `cd kindletters-backend && npm run dev`
2. Start frontend: `npm run dev`
3. Test API calls from frontend to backend
4. Verify authentication works across services

## Next Steps

1. Continue migrating remaining API routes
2. Update all frontend components to use backend API
3. Remove Next.js API routes (or mark as deprecated)
4. Set up CORS properly for production
5. Configure deployment for both services

