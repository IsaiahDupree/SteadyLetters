# SteadyLetters - Product Requirements Document (PRD)

**Version:** 2.0  
**Date:** January 2, 2026  
**Status:** Development - Phase 2  
**Product Name:** SteadyLetters (formerly KindLetters)

---

## 1. Executive Summary

SteadyLetters is a SaaS web application that enables users to create and send physical handwritten-style letters via API integration with Thanks.io. Users can generate AI-powered letters, customize with images, select handwriting styles, and send postcards, letters, and greeting cards to recipients worldwide.

### Vision
"Physical mail as a programmable channel - like email, but tangible and meaningful."

### Core Value Proposition
- **AI-Generated Letters**: Describe your intent, let AI craft the perfect message
- **Voice-to-Letter**: Record your thoughts, get polished handwritten correspondence
- **Multiple Mail Types**: Postcards, letters, greeting cards, gift cards
- **Tiered Pricing**: Free tier for testing, Pro/Business for volume sending

---

## 2. Target Users

### Primary Personas

| Persona | Description | Key Needs |
|---------|-------------|-----------|
| **Small Business Owner** | Sends thank-you cards to clients | Simple workflow, professional templates |
| **Sales Professional** | Maintains client relationships | CRM-like recipient management, bulk sending |
| **Creator/Influencer** | Engages with community | Personalized messages, brand consistency |
| **Individual** | Sends personal correspondence | Easy voice input, occasion templates |

### User Tiers

| Tier | Price | Letter Generations | Images | Letters Sent | Features |
|------|-------|-------------------|--------|--------------|----------|
| **Free** | $0 | 5/month | 3/month | 2/month | Postcards only |
| **Pro** | $29/month | 50/month | 25/month | 20/month | + Letters, Greeting Cards |
| **Business** | $99/month | Unlimited | 100/month | 100/month | + Windowless Letters, Gift Cards, API |

---

## 3. Feature Specifications

### 3.1 Letter Generation (Core Feature)

#### 3.1.1 Text Input Mode
- **Input**: User types or pastes message content
- **AI Enhancement**: One-click tone adjustment (formal, casual, warm, professional)
- **Variables**: Support `{{first_name}}`, `{{company}}`, etc.
- **Preview**: Real-time letter preview with selected handwriting style

#### 3.1.2 Voice Input Mode
- **Recording**: Browser-based voice recording (Web Audio API)
- **Transcription**: OpenAI Whisper API for speech-to-text
- **Enhancement**: Auto-polish transcribed text into letter format
- **Mobile Optimized**: Large touch targets, visual feedback

#### 3.1.3 AI Letter Composition
- **Inputs Required**:
  - Occasion (thank you, birthday, congratulations, thinking of you, etc.)
  - Tone (warm, professional, casual, formal, heartfelt)
  - Key points to include (optional)
  - Recipient context (optional)
- **Output**: 3 letter variations for user to choose from
- **Model**: OpenAI GPT-4o

### 3.2 Image Generation

#### 3.2.1 Front Image Options
- **Upload**: User uploads custom image (JPG, PNG, max 10MB)
- **AI Generate**: DALL-E 3 generates occasion-appropriate imagery
- **Templates**: Pre-designed seasonal/occasion templates
- **Requirements**: 4x6 @ 300dpi for postcards, appropriate sizes for other products

#### 3.2.2 Image Selection Flow
1. User selects occasion/theme
2. AI generates 4 image options
3. User selects preferred image
4. Image uploaded to Supabase Storage
5. Public URL passed to Thanks.io

### 3.3 Recipient Management

#### 3.3.1 Individual Recipients
- **Fields**: Name, Address Line 1, Address Line 2, City, State, ZIP, Country
- **Validation**: Real-time address validation (optional USPS API)
- **Tags**: Organize recipients by group (clients, family, VIPs)

#### 3.3.2 Address Extraction
- **Input**: Paste unformatted address text
- **AI Parsing**: GPT extracts structured address components
- **Review**: User confirms/edits extracted data

#### 3.3.3 Bulk Import
- **CSV Upload**: Standard CSV format with column mapping
- **Validation**: Highlight invalid/incomplete addresses
- **Deduplication**: Detect and merge duplicate recipients

### 3.4 Template System

#### 3.4.1 Template Components
- **Front Image**: Stored URL or uploaded image
- **Message Template**: Text with variable placeholders
- **Handwriting Style**: Thanks.io style ID
- **Handwriting Color**: Blue, black, green, purple, red, or hex
- **Occasion Tag**: Birthday, Thank You, Holiday, etc.

#### 3.4.2 Template Library
- **User Templates**: Saved by user for reuse
- **System Templates**: Pre-built occasion templates
- **Sharing**: Future - share templates publicly

### 3.5 Mail Products

| Product | Description | Base Price | Tiers |
|---------|-------------|------------|-------|
| **Postcard** | 4x6, 6x9, or 6x11 | $1.14-$1.83 | All |
| **Letter (Windowed)** | Standard business envelope | $1.20 | Pro+ |
| **Greeting Card** | Premium with real stamp | $3.00 | Pro+ |
| **Windowless Letter** | PDF support, real stamp | $2.52 | Business |
| **Gift Card** | Includes physical gift card | $3.00+ | Business |

### 3.6 Order Management

#### 3.6.1 Order Flow
1. Select recipient(s)
2. Choose/create template OR compose new letter
3. Select product type (postcard, letter, etc.)
4. Preview final output
5. Confirm and send
6. Track order status

#### 3.6.2 Order Statuses
- `pending` - Created, not yet sent to Thanks.io
- `queued` - Sent to Thanks.io, awaiting processing
- `processing` - Being printed
- `sent` - Mailed
- `delivered` - Confirmed delivery (where available)
- `failed` - Error in processing

#### 3.6.3 Webhook Integration
- Receive status updates from Thanks.io
- Update order records in real-time
- Send email notifications to users (optional)

### 3.7 Dashboard & Analytics

#### 3.7.1 Dashboard Metrics
- Letters sent (this period / all time)
- Credits remaining
- Recent orders with status
- Quick actions (new letter, add recipient)

#### 3.7.2 Analytics (Pro+)
- Send volume over time
- Recipient engagement (if trackable)
- Cost breakdown by product type
- Template performance

### 3.8 Billing & Subscriptions

#### 3.8.1 Stripe Integration
- Subscription management via Stripe Billing
- Customer portal for plan changes
- Usage-based billing for overage (future)

#### 3.8.2 Credit System
- Monthly allocation based on tier
- Credits reset on billing cycle
- No rollover
- Overage alerts at 80% usage

---

## 4. Technical Architecture

### 4.1 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, React 19, TypeScript |
| **Styling** | Tailwind CSS 4, shadcn/ui |
| **Database** | PostgreSQL (Supabase), Prisma ORM |
| **Auth** | Supabase Auth |
| **Storage** | Supabase Storage |
| **AI** | OpenAI GPT-4o, Whisper, DALL-E 3 |
| **Mail API** | Thanks.io |
| **Payments** | Stripe |
| **Deployment** | Vercel |

### 4.2 Database Schema (Current)

```
User
├── Recipients[]
├── Templates[]
├── Orders[]
├── MailOrders[]
├── UserUsage
└── Events[]
```

### 4.3 API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/generate/letter` | POST | AI letter generation |
| `/api/generate/image` | POST | AI image generation |
| `/api/transcribe` | POST | Voice transcription |
| `/api/recipients` | CRUD | Recipient management |
| `/api/templates` | CRUD | Template management |
| `/api/orders` | CRUD | Order management |
| `/api/send` | POST | Send via Thanks.io |
| `/api/webhooks/thanks` | POST | Thanks.io webhooks |
| `/api/webhooks/stripe` | POST | Stripe webhooks |

---

## 5. Current Implementation Status

### ✅ Completed
- [x] Next.js project setup with App Router
- [x] Supabase Auth integration
- [x] Prisma schema with all models
- [x] Basic UI components (shadcn/ui)
- [x] Voice recorder component
- [x] Address extraction component
- [x] Image upload component
- [x] Thanks.io client with all product types
- [x] OpenAI integration (letter generation)
- [x] Stripe integration (pricing, checkout)
- [x] Page routes (dashboard, generate, send, recipients, templates, orders)
- [x] Pricing tiers defined
- [x] Testing infrastructure (Jest, Playwright)

### 🚧 In Progress / Needs Completion
- [ ] Dashboard with real analytics data
- [ ] Server actions for CRUD operations
- [ ] Real Thanks.io API integration (currently mocks)
- [ ] Webhook handlers for order status updates
- [ ] Image upload to Supabase Storage (component exists, needs wiring)
- [ ] Template CRUD with database persistence
- [ ] Order history with status tracking
- [ ] Usage tracking and limit enforcement
- [ ] Production environment variables

### ❌ Not Started
- [ ] Email notifications
- [ ] Bulk send feature
- [ ] CSV import for recipients
- [ ] API key management for Business tier
- [ ] Template sharing
- [ ] Advanced analytics

---

## 6. Remaining Work - Implementation Spec

### Phase 2A: Core Functionality (Priority: HIGH)

#### 1. Server Actions Implementation
Create server actions in `/src/app/actions/`:

```typescript
// recipients.ts
export async function createRecipient(data: RecipientInput)
export async function getRecipients(userId: string)
export async function updateRecipient(id: string, data: Partial<RecipientInput>)
export async function deleteRecipient(id: string)

// templates.ts
export async function createTemplate(data: TemplateInput)
export async function getTemplates(userId: string)
export async function updateTemplate(id: string, data: Partial<TemplateInput>)
export async function deleteTemplate(id: string)

// orders.ts
export async function createOrder(data: OrderInput)
export async function getOrders(userId: string)
export async function getOrderById(id: string)
export async function updateOrderStatus(id: string, status: string)
```

#### 2. Dashboard Analytics
- Query real data from database
- Display: total letters sent, this week, by status
- Recent orders list with links

#### 3. Thanks.io Integration
- Add real API key to environment
- Test each product type endpoint
- Implement error handling and retries

#### 4. Webhook Handler
```typescript
// /api/webhooks/thanks/route.ts
- Verify webhook signature
- Parse order status update
- Update MailOrder record
- Trigger email notification (optional)
```

### Phase 2B: Polish & Testing (Priority: MEDIUM)

#### 5. Image Upload Flow
- Wire ImageUpload component to Supabase Storage
- Generate public URLs
- Update template form to use uploaded images

#### 6. Usage Tracking
- Increment counters on generation/send
- Check limits before allowing actions
- Display usage in settings/billing

#### 7. End-to-End Testing
- Complete Playwright test suite
- Test all user flows
- Verify production deployment

### Phase 2C: Enhancement (Priority: LOW)

#### 8. Bulk Operations
- Multi-select recipients
- Batch send with same template
- Progress tracking

#### 9. Notifications
- Email on order status change
- In-app notification center

---

## 7. Success Metrics

| Metric | Target (Month 1) | Target (Month 3) |
|--------|------------------|------------------|
| Registered Users | 100 | 500 |
| Letters Sent | 200 | 2,000 |
| Paid Subscribers | 10 | 50 |
| MRR | $300 | $2,000 |
| Churn Rate | <10% | <5% |

---

## 8. Launch Checklist

- [ ] All Phase 2A tasks complete
- [ ] Production environment configured
- [ ] Thanks.io API key active (live mode)
- [ ] Stripe live mode enabled
- [ ] Domain configured (steadyletters.com)
- [ ] SSL certificate active
- [ ] Error monitoring (Sentry) configured
- [ ] Analytics (PostHog/Mixpanel) configured
- [ ] Terms of Service published
- [ ] Privacy Policy published
- [ ] Customer support email configured

---

**Document Owner:** Isaiah Dupree  
**Last Updated:** January 2, 2026
