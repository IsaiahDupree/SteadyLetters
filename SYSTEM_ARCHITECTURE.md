# 🏗️ SteadyLetters - System Architecture

A complete overview of how all the pieces fit together.

---

## 📊 System Overview Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                            │
│                    (Desktop / Mobile)                           │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NEXT.JS APP (Port 3000)                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Pages     │  │ Components  │  │      API Routes         │ │
│  │  (src/app)  │  │(src/comps)  │  │    (src/app/api)        │ │
│  └─────────────┘  └─────────────┘  └───────────┬─────────────┘ │
└────────────────────────────────────────────────┼────────────────┘
                                                 │
              ┌──────────────────────────────────┼──────────────────────────────┐
              │                                  │                              │
              ▼                                  ▼                              ▼
┌─────────────────────┐      ┌─────────────────────────────┐      ┌─────────────────────┐
│    SUPABASE         │      │         OPENAI              │      │       STRIPE        │
│  (Auth + Database)  │      │    (AI Generation)          │      │     (Payments)      │
│                     │      │                             │      │                     │
│  - User Auth        │      │  - Letter Writing           │      │  - Subscriptions    │
│  - PostgreSQL DB    │      │  - Voice Transcription      │      │  - One-time Payments│
│  - Row Level Sec    │      │  - Image Analysis           │      │  - Webhooks         │
└─────────────────────┘      └─────────────────────────────┘      └─────────────────────┘
        │
        ▼
┌─────────────────────┐
│     THANKS.IO       │
│  (Letter Mailing)   │
│                     │
│  - Print Letters    │
│  - Physical Mailing │
└─────────────────────┘
```

---

## 📁 Project Structure

```
KindLetters/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API endpoints
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   ├── generate/      # AI generation endpoints
│   │   │   ├── orders/        # Order management
│   │   │   ├── recipients/    # Recipient CRUD
│   │   │   ├── stripe/        # Payment webhooks
│   │   │   └── templates/     # Template endpoints
│   │   ├── dashboard/         # Dashboard page
│   │   ├── generate/          # Letter generation page
│   │   ├── send/              # Send letter page
│   │   ├── login/             # Login page
│   │   ├── signup/            # Sign up page
│   │   ├── pricing/           # Pricing page
│   │   ├── billing/           # Billing management
│   │   ├── recipients/        # Recipients page
│   │   ├── templates/         # Templates page
│   │   ├── orders/            # Orders page
│   │   ├── analytics/         # Analytics page
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Homepage
│   │   └── globals.css        # Global styles
│   │
│   ├── components/            # Reusable components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── navbar.tsx        # Navigation bar
│   │   ├── footer.tsx        # Footer
│   │   ├── logo.tsx          # Logo component
│   │   ├── voice-recorder.tsx # Voice recording
│   │   └── ...
│   │
│   ├── lib/                   # Utility libraries
│   │   ├── supabase/         # Supabase client
│   │   ├── stripe.ts         # Stripe utilities
│   │   ├── openai.ts         # OpenAI utilities
│   │   └── utils.ts          # General utilities
│   │
│   ├── contexts/              # React contexts
│   │   └── auth-context.tsx  # Authentication context
│   │
│   └── middleware.ts          # Auth middleware
│
├── prisma/                    # Database schema
│   └── schema.prisma         # Prisma schema
│
├── supabase/                  # Supabase config
│   └── config.toml           # Local config
│
├── tests/                     # Test files
│   ├── e2e/                  # Playwright E2E tests
│   └── *.test.mjs            # Jest tests
│
├── public/                    # Static assets
│   └── logo.png              # App logo
│
├── scripts/                   # Utility scripts
│
└── Configuration Files
    ├── .env                  # Environment variables
    ├── package.json          # Dependencies
    ├── tsconfig.json         # TypeScript config
    ├── next.config.ts        # Next.js config
    └── playwright.config.ts  # Playwright config
```

---

## 🔧 Technology Stack

### Frontend
| Technology | Purpose | Version |
|------------|---------|---------|
| **Next.js** | React framework | 16.x |
| **React** | UI library | 19.x |
| **TypeScript** | Type safety | 5.x |
| **Tailwind CSS** | Styling | 4.x |
| **shadcn/ui** | UI components | Latest |
| **Lucide React** | Icons | Latest |

### Backend
| Technology | Purpose | Version |
|------------|---------|---------|
| **Next.js API Routes** | Backend APIs | 16.x |
| **Prisma** | Database ORM | 6.x |
| **Supabase** | Auth + Database | Latest |

### External Services
| Service | Purpose | Account Required |
|---------|---------|------------------|
| **Supabase** | Authentication & PostgreSQL database | Yes |
| **OpenAI** | AI text generation, voice transcription | Yes |
| **Stripe** | Payment processing | Yes |
| **Thanks.io** | Physical letter mailing | Yes |

### Development Tools
| Tool | Purpose |
|------|---------|
| **Jest** | Unit testing |
| **Playwright** | E2E testing |
| **ESLint** | Code linting |
| **Docker** | Local Supabase |

---

## 🔐 Authentication Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  User    │────▶│  Login   │────▶│ Supabase │────▶│  Session │
│  Clicks  │     │  Page    │     │   Auth   │     │  Cookie  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                        │
                                        ▼
                                 ┌──────────┐
                                 │   JWT    │
                                 │  Token   │
                                 └──────────┘
                                        │
                                        ▼
                                 ┌──────────┐
                                 │ Protected│
                                 │  Routes  │
                                 └──────────┘
```

### Auth Components
- **`src/contexts/auth-context.tsx`** - React context for auth state
- **`src/middleware.ts`** - Protects routes, redirects unauthenticated users
- **`src/lib/supabase/`** - Supabase client configuration

---

## 💳 Payment Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  User    │────▶│ Pricing  │────▶│  Stripe  │────▶│ Webhook  │
│  Selects │     │  Page    │     │ Checkout │     │ Received │
│  Plan    │     │          │     │          │     │          │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                                         │
                                                         ▼
                                                  ┌──────────┐
                                                  │  Update  │
                                                  │  User    │
                                                  │  Tier    │
                                                  └──────────┘
```

### Subscription Tiers
| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0/mo | 3 letters/month |
| **Pro** | $9.99/mo | 50 letters/month |
| **Business** | $29.99/mo | Unlimited letters |

---

## 📝 Letter Generation Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  User    │────▶│  Input   │────▶│  OpenAI  │────▶│  Letter  │
│  Input   │     │  Voice/  │     │   API    │     │  Text    │
│          │     │  Text    │     │          │     │          │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                                         │
                                                         ▼
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Order   │◀────│  Select  │◀────│  Preview │◀────│  Edit    │
│ Created  │     │ Recipient│     │  Letter  │     │  Letter  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
      │
      ▼
┌──────────┐     ┌──────────┐
│ Thanks.io│────▶│ Physical │
│   API    │     │  Mailing │
└──────────┘     └──────────┘
```

---

## 🗄️ Database Schema

### Core Tables

```sql
-- Users (managed by Supabase Auth)
users
├── id (uuid, primary key)
├── email (text)
├── created_at (timestamp)
└── ...

-- Recipients
recipients
├── id (uuid, primary key)
├── user_id (uuid, foreign key → users)
├── name (text)
├── address_line_1 (text)
├── address_line_2 (text)
├── city (text)
├── state (text)
├── postal_code (text)
├── country (text)
└── created_at (timestamp)

-- Templates
templates
├── id (uuid, primary key)
├── name (text)
├── description (text)
├── image_url (text)
├── category (text)
└── created_at (timestamp)

-- Orders
orders
├── id (uuid, primary key)
├── user_id (uuid, foreign key → users)
├── recipient_id (uuid, foreign key → recipients)
├── template_id (uuid, foreign key → templates)
├── letter_content (text)
├── status (text: draft, processing, sent, delivered)
├── thanks_io_order_id (text)
└── created_at (timestamp)

-- Subscriptions
subscriptions
├── id (uuid, primary key)
├── user_id (uuid, foreign key → users)
├── stripe_subscription_id (text)
├── tier (text: free, pro, business)
├── status (text)
└── current_period_end (timestamp)
```

---

## 🌐 API Endpoints

### Authentication
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/callback` | GET | OAuth callback |
| `/api/auth/signup` | POST | Create account |
| `/api/auth/login` | POST | Sign in |
| `/api/auth/logout` | POST | Sign out |

### Recipients
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/recipients` | GET | List recipients |
| `/api/recipients` | POST | Create recipient |
| `/api/recipients/[id]` | GET | Get recipient |
| `/api/recipients/[id]` | PUT | Update recipient |
| `/api/recipients/[id]` | DELETE | Delete recipient |

### Orders
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/orders` | GET | List orders |
| `/api/orders` | POST | Create order |
| `/api/orders/[id]` | GET | Get order |

### Generation
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/generate` | POST | Generate letter |
| `/api/generate/transcribe` | POST | Transcribe voice |
| `/api/generate/enhance` | POST | Enhance text |

### Payments
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/stripe/checkout` | POST | Create checkout session |
| `/api/stripe/webhook` | POST | Handle Stripe events |
| `/api/stripe/portal` | POST | Customer portal |

---

## 🔒 Environment Variables

### Required for Development
```env
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Supabase
NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54421"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."

# OpenAI
OPENAI_API_KEY="sk-..."

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRO_PRICE_ID="price_..."
STRIPE_BUSINESS_PRICE_ID="price_..."

# Thanks.io
THANKS_IO_API_KEY="..."

# App
NEXT_PUBLIC_URL="http://localhost:3000"
```

### Production Differences
- Use production Supabase URL
- Use live Stripe keys
- Set proper `NEXT_PUBLIC_URL`

---

## 🚀 Deployment Architecture

### Local Development
```
Docker → Supabase (local)
         ↓
Next.js dev server (port 3000)
```

### Production (Vercel)
```
Vercel Edge Network
         ↓
Next.js (Serverless Functions)
         ↓
    ┌────┴────┐
    ↓         ↓
Supabase   Stripe
(Cloud)    (Cloud)
```

---

## 📋 Ports Reference

| Service | Port | Purpose |
|---------|------|---------|
| Next.js App | 3000 | Main application |
| Supabase API | 54421 | REST API |
| Supabase DB | 54422 | PostgreSQL |
| Supabase Studio | 54423 | Database UI |
| Backend API | 3434 | Backend service (if separate) |
| Dashboard | 3535 | Monitoring dashboard (if separate) |

---

## 🔄 Data Flow Summary

1. **User authenticates** → Supabase Auth → JWT token stored in cookie
2. **User generates letter** → OpenAI API → Text returned
3. **User creates order** → Database record + Thanks.io API
4. **User subscribes** → Stripe checkout → Webhook updates database
5. **Letter sent** → Thanks.io prints and mails

---

**Document Created:** December 2024  
**Version:** 1.0
