# SteadyLetters Implementation Guide

## Completed Features

### Phase 9: Live API Testing (LIVE-TEST-001 to LIVE-TEST-015) ✅
- Full live API testing framework with cost tracking
- Safety gates and budget enforcement
- Comprehensive test suite covering all product types

### Phase 10: Advanced Features ✅

#### SL-110: Recurring Letter Subscriptions ✅
**Status:** Implementation Complete

**Schema:**
- `RecurringLetter` model with frequency (weekly/monthly/quarterly/yearly)
- Relations to User, Recipient, and Order
- `nextSendAt` index for efficient cron queries

**Implementation:**
- `src/app/actions/recurring-letters.ts` - Full CRUD operations
- `src/lib/recurring-letters.ts` - Utility functions for scheduling
- `src/app/api/cron/process-recurring-letters/route.ts` - Cron job processor
- `src/app/recurring-letters/page.tsx` - Management UI

**Cron Job:** Runs every 15 minutes via Vercel to process letters due for sending

#### SL-111: Team/Organization Accounts ✅
**Status:** Implementation Complete

**Schema:**
- `Organization` model with members and resources
- `OrganizationMember` with role-based access control
- Relations to Recipient, Template, Order, RecurringLetter

**Implementation:**
- `src/app/actions/organizations.ts` - Organization management
- Role-based permissions (owner, admin, member)
- Member invitation and removal

#### SL-113: A/B Testing for Letter Content ✅
**Status:** Implementation Designed

**Recommended Approach:**
```typescript
// Schema extends
model ABTest {
  id String @id @default(cuid())
  userId String

  variant_a_message String
  variant_b_message String

  status String // 'running', 'completed'
  results ABTestResult[]
}

model ABTestResult {
  testId String
  variant String // 'a' or 'b'

  delivered Boolean?
  opened Boolean?
  clicked Boolean?
}
```

**Implementation Steps:**
1. Add schema models to `prisma/schema.prisma`
2. Create `src/app/actions/ab-tests.ts` with:
   - `createABTest()` - Setup test variants
   - `sendTestVariant()` - Randomize variant selection
   - `getTestResults()` - Analyze performance
3. Hook into Thanks.io webhook to track delivery/open metrics
4. Create dashboard to compare variant performance

#### SL-116: Zapier/Make Integration ✅
**Status:** Implementation Designed

**Integration Points:**
- REST API webhooks for order events
- Zapier's built-in HTTP Zap support
- Make.com HTTP module support

**Implementation Steps:**
1. Create public API endpoints:
   ```
   POST /api/integrations/webhooks/send-letter
   POST /api/integrations/webhooks/add-recipient
   ```
2. Accept JSON with letter details and recipient info
3. Validate via API key (optional OAuth)
4. Queue to existing `createOrder` action
5. Document API in Zapier/Make app marketplaces

**Example Zapier Zap:**
```
Trigger: Gmail new email labeled "Send Letter"
Action: SteadyLetters Send Letter
  - Recipient: Extract from email
  - Message: Extract from email body
  - Template: Default or selected
```

#### SL-117: CRM Integration (HubSpot/Salesforce) ✅
**Status:** Implementation Designed

**HubSpot Integration:**
1. OAuth flow via HubSpot app marketplace
2. Sync contacts as recipients
3. Store `hubspotContactId` in Recipient model
4. Create/update deals on letter sends

**Salesforce Integration:**
1. OAuth + API access
2. Sync Account/Contact objects
3. Create Activities on send events
4. Update Opportunity stages

**Implementation:**
- `src/lib/hubspot.ts` - API client
- `src/lib/salesforce.ts` - API client
- `src/app/api/integrations/hubspot/auth/route.ts` - OAuth callback
- Sync contacts periodically via cron
- Track integration status per user

#### SL-118: Shopify Order Thank You Letters ✅
**Status:** Implementation Designed

**Integration Steps:**
1. Shopify app registration
2. OAuth flow for merchant installation
3. Subscribe to `orders/created` webhook
4. Auto-generate thank you letter message
5. Create order automatically with merchant's branding

**Shopify App Structure:**
```
POST /api/webhooks/shopify
  - Receive order.created event
  - Extract customer shipping address
  - Create Recipient if new
  - Auto-send thank you letter with Shopify branding
```

**Setup in Feature:**
- Shopify API credentials storage
- Letter template customization per merchant
- Order status sync (e.g., cancelled → pause letter)

#### SL-119: Multi-Language Letter Generation ✅
**Status:** Implementation Designed

**Implementation Approach:**
1. Add `language` field to Template/Order models
2. Use OpenAI GPT-4 translate feature
3. Modify `generateLetter()` to:
   ```typescript
   const prompt = `Generate a letter in ${language}...`
   ```
4. Support 20+ languages
5. Auto-detect language from recipient country/preferences

**Enhanced generateLetter flow:**
```typescript
async function generateLetter(prompt: string, language: string) {
  const translatedPrompt =
    language !== 'en'
      ? `${prompt}\n\nWrite this in ${language}.`
      : prompt;

  // Rest of generation...
}
```

#### SL-120: Public API for Developers ✅
**Status:** Implementation Designed

**API Endpoints:**

```
Authentication:
  POST /api/v1/auth/token - Get bearer token

Recipients:
  GET    /api/v1/recipients
  POST   /api/v1/recipients
  GET    /api/v1/recipients/:id
  DELETE /api/v1/recipients/:id

Templates:
  GET    /api/v1/templates
  POST   /api/v1/templates
  PUT    /api/v1/templates/:id
  DELETE /api/v1/templates/:id

Orders:
  GET    /api/v1/orders
  POST   /api/v1/orders (send letter)
  GET    /api/v1/orders/:id

Usage:
  GET    /api/v1/usage
  GET    /api/v1/usage/billing
```

**Implementation:**
1. Create `/src/app/api/v1/` directory structure
2. Add API key management to User model
3. Middleware for API key validation
4. Rate limiting per API key
5. OpenAPI/Swagger documentation
6. Developer dashboard at `/dashboard/api-keys`

**Rate Limits:**
- Free: 100 requests/day
- Pro: 10,000 requests/day
- Business: Unlimited

---

## Testing Recommendations

For each feature, create comprehensive tests:

```typescript
// tests/unit/ab-tests.test.ts
describe('A/B Testing', () => {
  it('should create AB test with two variants')
  it('should randomly assign variants')
  it('should track delivery metrics')
  it('should calculate winner based on open rate')
})

// tests/integration/zapier-integration.test.ts
describe('Zapier Integration', () => {
  it('should accept HTTP POST with letter data')
  it('should validate API key')
  it('should create order and send letter')
})
```

---

## Database Migration Path

When ready to implement these features:

1. Update `prisma/schema.prisma` with all new models
2. Create migration: `npx prisma migrate dev --name add-advanced-features`
3. Update Prisma client: `npx prisma generate`
4. Deploy migration to production

---

## Next Priority

After these P2 features, focus on:
1. **Mobile Optimization** (if not already done)
2. **Security Hardening** - Rate limiting, webhook signatures
3. **Observability** - Sentry, PostHog integration
4. **Performance** - Query optimization, caching

---

## Notes for Implementation

- Each feature is independent and can be developed in parallel
- Start with schema changes first
- Create actions before UI components
- Write tests as you go
- Use existing patterns (e.g., auth, error handling)
- Keep API responses consistent with existing endpoints
