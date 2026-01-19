# SteadyLetters: Developer Handoff Document

**Version:** 1.0  
**Date:** January 19, 2026  
**Project Status:** Development - Phase 2  
**Last Updated By:** Development Team

---

## 1. Project Overview

**SteadyLetters** (formerly KindLetters) is a SaaS web application that enables users to create and send physical handwritten-style letters via API integration with Thanks.io.

### Core Features
- AI-powered letter generation (OpenAI GPT-4o)
- Voice-to-text transcription (OpenAI Whisper)
- AI image generation for cards (DALL-E 3)
- Multiple mail products (postcards, letters, greeting cards)
- Tiered subscription pricing (Free/Pro/Business)
- Usage tracking and limits

### Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui |
| Database | PostgreSQL (Supabase), Prisma ORM |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| AI | OpenAI GPT-4o, Whisper, DALL-E 3 |
| Mail API | Thanks.io |
| Payments | Stripe |
| Deployment | Vercel |

---

## 2. Repository Structure

```
/Users/isaiahdupree/Documents/Software/KindLetters/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── actions/            # Server actions (CRUD operations)
│   │   ├── api/                # API routes
│   │   ├── dashboard/          # Dashboard page
│   │   ├── generate/           # Letter generation page
│   │   ├── send/               # Send letter page
│   │   ├── recipients/         # Recipient management
│   │   ├── templates/          # Template management
│   │   ├── orders/             # Order history
│   │   ├── billing/            # Billing/subscription page
│   │   ├── pricing/            # Pricing page
│   │   └── ...
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── navbar.tsx          # Navigation (needs mobile work)
│   │   ├── voice-recorder.tsx  # Voice input component
│   │   ├── image-upload.tsx    # Image upload component
│   │   └── ...
│   ├── lib/                    # Utility libraries
│   │   ├── thanks-io.ts        # Thanks.io API client
│   │   ├── openai.ts           # OpenAI integrations
│   │   ├── stripe.ts           # Stripe client
│   │   ├── prisma.ts           # Prisma client
│   │   ├── usage.ts            # Usage tracking utilities
│   │   ├── tiers.ts            # Tier limits & checking
│   │   ├── events.ts           # Event tracking
│   │   └── ...
│   └── contexts/               # React contexts
├── prisma/
│   └── schema.prisma           # Database schema
├── tests/                      # Test files (48+ test files)
│   ├── e2e/                    # Playwright E2E tests
│   ├── unit/                   # Unit tests
│   └── ...
├── kindletters-backend/        # Express backend (separate service)
├── public/                     # Static assets
└── PRD_*.md                    # Product requirement documents
```

---

## 3. Key Files Reference

### Server Actions (Database Operations)
| File | Functions | Status |
|------|-----------|--------|
| `src/app/actions/recipients.ts` | `createRecipient`, `getRecipients`, `deleteRecipient` | ✅ Complete |
| `src/app/actions/templates.ts` | `createTemplate`, `getTemplates`, `updateTemplate`, `deleteTemplate` | ✅ Complete |
| `src/app/actions/orders.ts` | `createOrder`, `getOrders`, `getOrderById`, `updateOrderStatus` | ✅ Complete |
| `src/app/actions/dashboard.ts` | `getDashboardStats` | ✅ Complete |

### API Routes
| Route | Method | Purpose | Status |
|-------|--------|---------|--------|
| `/api/health` | GET | Health check | ✅ |
| `/api/generate/letter` | POST | AI letter generation | ✅ |
| `/api/generate/images` | POST | AI image generation (4 images) | ✅ |
| `/api/transcribe` | POST | Voice transcription | ✅ |
| `/api/handwriting-styles` | GET | Thanks.io styles | ✅ |
| `/api/webhooks/thanks` | POST | Thanks.io status webhooks | ⚠️ No signature verify |
| `/api/stripe/webhook` | POST | Stripe webhooks | ✅ With signature |
| `/api/stripe/checkout` | POST | Create checkout session | ✅ |
| `/api/stripe/portal` | POST | Customer portal | ✅ |

### Core Libraries
| File | Purpose | Notes |
|------|---------|-------|
| `src/lib/thanks-io.ts` | Thanks.io API client | Falls back to mocks if no API key |
| `src/lib/openai.ts` | Letter/image generation | Uses GPT-4o and DALL-E 3 |
| `src/lib/tiers.ts` | Tier limits & `canGenerate()` | FREE/PRO/BUSINESS limits |
| `src/lib/usage.ts` | Usage tracking helpers | `checkUsageLimit()`, `incrementUsage()` |
| `src/lib/events.ts` | Event tracking | `trackEvent()`, stored in DB |
| `src/lib/storage.ts` | Supabase Storage | `uploadImage()`, `deleteImage()` |

---

## 4. Database Schema

**Location:** `prisma/schema.prisma`

### Models
| Model | Purpose | Key Fields |
|-------|---------|------------|
| `User` | User accounts | Stripe fields, return address |
| `UserUsage` | Usage tracking | letterGenerations, imageGenerations, tier |
| `Recipient` | Address book | name, address1-2, city, state, zip |
| `Template` | Saved letter templates | message, handwritingStyle, occasion |
| `Order` | Order records | recipientId, templateId, status, thanksIoOrderId |
| `MailOrder` | Detailed mail orders | productType, cost, recipientCount |
| `Event` | Analytics events | eventType, metadata, timestamp |

### Common Commands
```bash
# Generate Prisma client
npx prisma generate

# Push schema changes to database
npx prisma db push

# Run migrations
npx prisma migrate dev

# Open Prisma Studio (database GUI)
npx prisma studio
```

---

## 5. Environment Variables

**Files:** `.env`, `.env.local`

### Required Variables
```env
# Database
DATABASE_URL=postgresql://...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# OpenAI
OPENAI_API_KEY=sk-...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_BUSINESS_PRICE_ID=price_...

# Thanks.io
THANKS_IO_API_KEY=...

# Backend (if using separate backend)
BACKEND_URL=https://...
```

---

## 6. Current Implementation Status

### ✅ Complete & Working
- [x] User authentication (Supabase Auth)
- [x] Letter generation with AI (GPT-4o)
- [x] Image generation (DALL-E 3, 4 images per request)
- [x] Voice transcription (Whisper)
- [x] Recipient CRUD operations
- [x] Template CRUD operations
- [x] Order creation with Thanks.io integration
- [x] Usage tracking & limit enforcement
- [x] Stripe subscription flow
- [x] Dashboard with real database queries
- [x] Event tracking for analytics

### ⚠️ Needs Attention
- [ ] **Mobile navigation** - No hamburger menu, links overflow
- [ ] **Mobile CSS** - Missing touch targets, iOS zoom fix
- [ ] **Thanks.io webhook signature** - Currently accepts any request
- [ ] **Order send action** - Doesn't check usage limits before send

### ❌ Not Started
- [ ] Email notifications
- [ ] Bulk send feature
- [ ] CSV import for recipients
- [ ] API key management (Business tier)
- [ ] Template sharing

---

## 7. Testing

### Test Infrastructure
- **Unit Tests:** Jest (`tests/unit/`)
- **E2E Tests:** Playwright (`tests/e2e/`)
- **Integration Tests:** Custom (`tests/integration/`)

### Running Tests
```bash
# Run all Jest tests
npm test

# Run Playwright E2E tests
npx playwright test

# Run specific test file
npx playwright test tests/e2e/app.spec.ts

# Run with UI
npx playwright test --ui
```

### Test Coverage
- 48+ test files covering API endpoints, auth, billing, features
- E2E tests for critical user flows
- Security and performance test suites

---

## 8. Deployment

### Production (Vercel)
- **URL:** Configured in Vercel dashboard
- **Branch:** `main` auto-deploys
- **Environment:** Set in Vercel project settings

### Deploy Commands
```bash
# Deploy to Vercel
vercel

# Deploy to production
vercel --prod
```

### Post-Deploy Checklist
1. Verify environment variables are set
2. Run database migrations if schema changed
3. Test health endpoint: `GET /api/health`
4. Verify Stripe webhook is receiving events
5. Check Supabase auth is working

---

## 9. PRD Documents

| Document | Purpose | Priority |
|----------|---------|----------|
| `PRD_STEADYLETTERS.md` | Main product requirements | Reference |
| `PRD_MOBILE_OPTIMIZATION.md` | Mobile responsive design | HIGH - Not started |
| `PRD_STATUS_REPORT.md` | Current implementation status | Reference |
| `PRD_GAPS_AND_IMPROVEMENTS.md` | Gap analysis & tech debt | Reference |
| `PRD_SECURITY_HARDENING.md` | Security improvements | MEDIUM |
| `PRD_OBSERVABILITY.md` | Monitoring & logging | MEDIUM |

---

## 10. Immediate Action Items

### Priority 1: Mobile (2-4 hours)
1. Implement hamburger menu in `src/components/navbar.tsx`
2. Add mobile CSS utilities to `src/app/globals.css`
3. Test on mobile viewports

### Priority 2: Security (1-2 hours)
1. Add signature verification to `src/app/api/webhooks/thanks/route.ts`
2. Add `THANKS_IO_WEBHOOK_SECRET` to environment variables

### Priority 3: Code Cleanup (1 hour)
1. Extract shared `getCurrentUser()` to `src/lib/server-auth.ts`
2. Add usage limit check to order creation flow

---

## 11. Development Workflow

### Local Development
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# App runs at http://localhost:3000
```

### Making Changes
1. Create feature branch from `main`
2. Make changes
3. Run tests: `npm test`
4. Create PR
5. Merge to `main` triggers Vercel deploy

### Adding a New API Route
1. Create file: `src/app/api/[route]/route.ts`
2. Export HTTP method handlers (GET, POST, etc.)
3. Use `getAuthenticatedUser()` for protected routes
4. Add error handling with try-catch
5. Add tests

### Adding a New Server Action
1. Add to appropriate file in `src/app/actions/`
2. Mark with `'use server'` at top
3. Use `getCurrentUser()` for auth
4. Call `revalidatePath()` after mutations
5. Return `{ success: boolean, error?: string }`

---

## 12. Contact & Resources

### External Services
| Service | Dashboard URL |
|---------|---------------|
| Vercel | https://vercel.com/dashboard |
| Supabase | https://supabase.com/dashboard |
| Stripe | https://dashboard.stripe.com |
| OpenAI | https://platform.openai.com |
| Thanks.io | https://thanks.io/dashboard |

### Documentation
- **Main PRD:** `PRD_STEADYLETTERS.md`
- **Architecture:** `SYSTEM_ARCHITECTURE.md`
- **Testing Guide:** `TESTING_GUIDE.md`
- **Quick Start:** `QUICK_START.md`

---

**Document Created:** January 19, 2026  
**For Questions:** Contact project owner
