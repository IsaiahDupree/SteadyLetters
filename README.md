# SteadyLetters

**AI-Powered Physical Letter Sending Platform**

A SaaS web application that enables users to create and send physical handwritten-style letters via Thanks.io API integration. Features AI letter generation, voice transcription, image generation, and subscription-based usage tiers.

---

## Quick Start

### Development Server

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Prerequisites

- Node.js 20+
- PostgreSQL database (or Supabase account)
- Required API keys (see Environment Setup below)

---

## Tech Stack

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

## Environment Setup

Create a `.env.local` file with the following variables:

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
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_BUSINESS_PRICE_ID=price_...

# Thanks.io
THANKS_IO_API_KEY=...
```

See `DEVELOPER_HANDOFF.md` for complete environment variable documentation.

---

## Project Structure

```
/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── actions/            # Server actions (CRUD operations)
│   │   ├── api/                # API routes
│   │   ├── dashboard/          # Dashboard page
│   │   ├── generate/           # Letter generation page
│   │   ├── send/               # Send letter page
│   │   ├── recipients/         # Recipient management
│   │   ├── templates/          # Template management
│   │   ├── orders/             # Order history
│   │   └── billing/            # Subscription management
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── navbar.tsx
│   │   ├── voice-recorder.tsx
│   │   └── ...
│   └── lib/                    # Utility libraries
│       ├── thanks-io.ts        # Thanks.io API client
│       ├── openai.ts           # OpenAI integrations
│       ├── stripe.ts           # Stripe client
│       ├── usage.ts            # Usage tracking
│       └── tiers.ts            # Subscription tier logic
├── prisma/
│   └── schema.prisma           # Database schema
├── tests/                      # Test files (48+ tests)
│   ├── e2e/                    # Playwright E2E tests
│   └── unit/                   # Jest unit tests
└── PRD_*.md                    # Product requirement documents
```

---

## Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Testing
npm test                 # Run Jest tests
npm run test:e2e         # Run Playwright E2E tests
npm run test:all         # Run all tests

# Database
npx prisma generate      # Generate Prisma client
npx prisma db push       # Push schema changes
npx prisma migrate dev   # Run migrations
npx prisma studio        # Open database GUI

# Diagnostics
npm run check:env        # Verify environment variables
npm run validate:keys    # Validate API keys
npm run diagnose         # Run full diagnostic suite
```

---

## Development Status

**Current Phase:** 6 - Mobile Optimization
**Features Completed:** 31/71 (43.7%)
**Latest Update:** January 20, 2026

### ✅ Phase 1-5 Complete
- AI letter generation (GPT-4o)
- Voice transcription (Whisper)
- Image generation (DALL-E 3)
- Recipient management
- Template management
- Order creation and tracking
- Stripe subscriptions and billing
- Dashboard analytics

### 🚧 Phase 6 - In Progress
- Mobile hamburger menu
- Touch-friendly UI
- Mobile responsive layouts
- iOS optimizations

### 📋 Phase 7 - Planned
- Webhook signature verification
- Rate limiting
- Security headers
- Input validation

See `feature_list.json` for complete feature tracking.

---

## Autonomous Development

This project uses an autonomous coding harness for incremental feature development.

### Key Files
- `feature_list.json` - All 71 features with pass/fail status
- `claude-progress.txt` - Session log for autonomous agents
- `harness-status.json` - Current harness state
- `DEVELOPER_HANDOFF.md` - Comprehensive project documentation

### Feature Status
Run the test harness to check feature completion:

```bash
npm run test:all
```

Features are marked as `"passes": true` when:
1. Implementation is complete
2. Tests are passing
3. Acceptance criteria are met

---

## Documentation

| Document | Purpose |
|----------|---------|
| `DEVELOPER_HANDOFF.md` | Complete developer guide |
| `PRD_STEADYLETTERS.md` | Main product requirements |
| `PRD_STATUS_REPORT.md` | Current implementation status |
| `PRD_MOBILE_OPTIMIZATION.md` | Mobile requirements |
| `PRD_SECURITY_HARDENING.md` | Security requirements |
| `PRD_OBSERVABILITY.md` | Monitoring and analytics |
| `feature_list.json` | Feature tracking (71 features) |
| `claude-progress.txt` | Development session log |

---

## Deployment

### Vercel Deployment

The main branch auto-deploys to production via Vercel.

```bash
vercel              # Deploy preview
vercel --prod       # Deploy to production
```

### Post-Deploy Checklist
1. Verify environment variables in Vercel dashboard
2. Run database migrations if schema changed
3. Test `/api/health` endpoint
4. Verify Stripe webhooks are receiving events
5. Check Supabase authentication

---

## Testing

### Unit Tests (Jest)
```bash
npm test                    # All unit tests
npm test -- tests/unit/api  # Specific directory
```

### E2E Tests (Playwright)
```bash
npm run test:e2e           # All E2E tests
npm run test:e2e:local     # Local environment only
npm run test:e2e:both      # Both local and production
```

### Test Coverage
- 48+ test files
- API endpoint tests
- Authentication tests
- Billing flow tests
- E2E user journey tests

---

## Core Features

### AI Letter Generation
- OpenAI GPT-4o for letter composition
- Multiple occasions and tones
- Handwriting style selection
- Usage tracking per tier

### Voice Transcription
- OpenAI Whisper API
- Real-time audio recording
- Automatic transcription to letter text

### Image Generation
- DALL-E 3 for card images
- 4 images generated per request
- Stored in Supabase Storage

### Subscription Tiers

| Tier | Monthly Letters | Monthly Images | Price |
|------|----------------|----------------|-------|
| Free | 10 | 5 | $0 |
| Pro | 100 | 50 | $29/mo |
| Business | Unlimited | Unlimited | $99/mo |

### Mail Products
- Postcards (4x6")
- Letters (8.5x11")
- Greeting Cards (5x7")
- Windowless Letters

---

## Contributing

1. Create a feature branch from `main`
2. Make changes
3. Run tests: `npm run test:all`
4. Update `feature_list.json` if completing a feature
5. Create pull request
6. Merge triggers auto-deploy

---

## External Services

| Service | Dashboard |
|---------|-----------|
| Vercel | https://vercel.com/dashboard |
| Supabase | https://supabase.com/dashboard |
| Stripe | https://dashboard.stripe.com |
| OpenAI | https://platform.openai.com |
| Thanks.io | https://thanks.io/dashboard |

---

## Support & Resources

- **Project Documentation:** See `/docs` and `PRD_*.md` files
- **Database Schema:** `prisma/schema.prisma`
- **API Reference:** See individual route files in `src/app/api/`
- **Component Library:** shadcn/ui components in `src/components/ui/`

---

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)

---

**Project:** SteadyLetters (formerly KindLetters)
**Version:** 1.0 (Development)
**Last Updated:** January 20, 2026
