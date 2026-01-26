# Growth Data Plane Schema Documentation

**Status:** ✅ Complete (GDP-001)
**Version:** 1.0
**Date:** January 26, 2026

## Overview

The Growth Data Plane (GDP) is a unified data infrastructure that consolidates customer data from all touchpoints into a single, queryable system. It enables sophisticated segmentation, attribution, and personalized automation for SteadyLetters.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     DATA SOURCES                            │
├─────────────────────────────────────────────────────────────┤
│  Web App  │  PostHog  │  Stripe  │  Resend  │  Meta Pixel │
└────┬───────────┬──────────┬─────────┬─────────────┬─────────┘
     │           │          │         │             │
     └───────────┴──────────┴─────────┴─────────────┘
                          ↓
     ┌────────────────────────────────────────┐
     │      GROWTH DATA PLANE (GDP)            │
     │                                        │
     │  ┌──────────┐  ┌──────────────┐      │
     │  │  Person  │──│ IdentityLink │      │
     │  └──────────┘  └──────────────┘      │
     │       │                               │
     │  ┌────┴─────────┬────────────┐       │
     │  │              │            │       │
     │  │              │            │       │
     │  ▼              ▼            ▼       │
     │  UnifiedEvent  EmailMessage  Deal   │
     │                                        │
     │  ┌─────────────┐  ┌────────────┐     │
     │  │PersonFeatures│─│  Segment   │     │
     │  └─────────────┘  └────────────┘     │
     └────────────────────────────────────────┘
                          ↓
     ┌────────────────────────────────────────┐
     │            AUTOMATIONS                  │
     ├────────────────────────────────────────┤
     │  Email Campaigns │ Meta Audiences      │
     │  Push Notifications │ Webhook Triggers │
     └────────────────────────────────────────┘
```

## Core Tables

### 1. Person

The canonical customer record that unifies all identities and events.

```prisma
model Person {
  id             String   @id @default(cuid())

  // Core identity
  email          String?  @unique
  phone          String?
  firstName      String?
  lastName       String?

  // Computed traits
  activeDays     Int      @default(0)
  coreActions    Int      @default(0)
  lifetimeValue  Decimal  @default(0) @db.Decimal(10, 2)

  // Timestamps
  firstSeenAt    DateTime @default(now())
  lastSeenAt     DateTime @default(now())
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relations
  identityLinks  IdentityLink[]
  unifiedEvents  UnifiedEvent[]
  emailMessages  EmailMessage[]
  subscriptions  PersonSubscription[]
  deals          Deal[]
  features       PersonFeatures?
  segmentMembers SegmentMember[]
}
```

**Key Concepts:**
- **Identity Resolution:** A single Person can have multiple identities (anonymous → email signup → Stripe customer)
- **Computed Traits:** Fields like `activeDays` and `lifetimeValue` are updated via background jobs
- **Indexed Fields:** `email` and `lastSeenAt` for fast lookups

**Usage Example:**

```typescript
import { prisma } from '@/lib/prisma';

// Find or create person by email
async function getOrCreatePerson(email: string) {
  return await prisma.person.upsert({
    where: { email },
    update: { lastSeenAt: new Date() },
    create: {
      email,
      firstSeenAt: new Date(),
      lastSeenAt: new Date(),
    },
  });
}
```

---

### 2. IdentityLink

Links a Person to external system IDs for cross-system identity resolution.

```prisma
model IdentityLink {
  id         String   @id @default(cuid())
  personId   String
  person     Person   @relation(fields: [personId], references: [id], onDelete: Cascade)

  source     String   // 'posthog', 'stripe', 'meta', 'user', 'anonymous'
  externalId String   // The ID in that system

  createdAt  DateTime @default(now())

  @@unique([source, externalId])
  @@index([personId])
}
```

**Identity Sources:**

| Source | External ID | Use Case |
|--------|-------------|----------|
| `user` | User.id | Link to Supabase Auth user |
| `posthog` | PostHog distinct_id | Link behavioral analytics |
| `stripe` | Stripe customer_id | Link payment data |
| `meta` | Meta fbp cookie | Link ad attribution |
| `anonymous` | Session ID | Track pre-signup activity |

**Usage Example:**

```typescript
// Link PostHog identity to Person
async function linkPostHogIdentity(personId: string, postHogId: string) {
  await prisma.identityLink.create({
    data: {
      personId,
      source: 'posthog',
      externalId: postHogId,
    },
  });
}

// Find person by Stripe customer ID
async function findPersonByStripeId(stripeCustomerId: string) {
  const link = await prisma.identityLink.findUnique({
    where: {
      source_externalId: {
        source: 'stripe',
        externalId: stripeCustomerId,
      },
    },
    include: { person: true },
  });

  return link?.person;
}
```

---

### 3. UnifiedEvent

Normalized events from all sources (web, email, Stripe, Meta).

```prisma
model UnifiedEvent {
  id            String   @id @default(cuid())
  personId      String?
  person        Person?  @relation(fields: [personId], references: [id], onDelete: SetNull)

  // Event data
  eventName     String
  source        String   // 'web', 'app', 'email', 'stripe', 'meta'
  properties    Json     @default("{}")

  // Attribution
  sessionId     String?
  referrer      String?
  utmSource     String?
  utmMedium     String?
  utmCampaign   String?

  // Timestamps
  timestamp     DateTime @default(now())

  @@index([personId, eventName])
  @@index([timestamp])
  @@index([source])
}
```

**Event Schema:**

All events follow this normalized structure:

```typescript
interface UnifiedEventData {
  id: string;
  personId: string | null;
  eventName: string;  // e.g., 'letter_sent', 'email_opened', 'purchase_completed'
  source: 'web' | 'app' | 'email' | 'stripe' | 'meta';
  properties: Record<string, any>;  // Event-specific properties
  sessionId?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  timestamp: Date;
}
```

**Standard Event Names:**

| Event | Source | Description |
|-------|--------|-------------|
| `landing_view` | web | User views landing page |
| `signup_completed` | web | User completes signup |
| `letter_created` | app | User creates a letter |
| `letter_sent` | app | User sends a letter |
| `email_opened` | email | User opens marketing email |
| `email_clicked` | email | User clicks link in email |
| `purchase_completed` | stripe | User completes payment |
| `subscription_started` | stripe | User starts subscription |

**Usage Example:**

```typescript
// Track a unified event
async function trackUnifiedEvent(data: {
  personId: string;
  eventName: string;
  source: string;
  properties?: Record<string, any>;
  utmSource?: string;
}) {
  await prisma.unifiedEvent.create({
    data: {
      personId: data.personId,
      eventName: data.eventName,
      source: data.source,
      properties: data.properties || {},
      utmSource: data.utmSource,
      timestamp: new Date(),
    },
  });
}

// Query events for a person
async function getPersonEvents(personId: string) {
  return await prisma.unifiedEvent.findMany({
    where: { personId },
    orderBy: { timestamp: 'desc' },
    take: 50,
  });
}
```

---

## Email Tables

### 4. EmailMessage

Tracks all emails sent via Resend.

```prisma
model EmailMessage {
  id            String   @id @default(cuid())
  personId      String
  person        Person   @relation(fields: [personId], references: [id], onDelete: Cascade)

  // Email metadata
  resendId      String   @unique
  from          String
  to            String
  subject       String
  tags          Json     @default("[]")  // Array of tags

  // Campaign tracking
  campaign      String?
  segmentId     String?

  sentAt        DateTime @default(now())

  // Relations
  emailEvents   EmailEvent[]
}
```

**Usage Example:**

```typescript
// Store an email record
async function storeEmailMessage(data: {
  personId: string;
  resendId: string;
  to: string;
  subject: string;
  campaign?: string;
}) {
  await prisma.emailMessage.create({
    data: {
      personId: data.personId,
      resendId: data.resendId,
      from: 'no-reply@steadyletters.com',
      to: data.to,
      subject: data.subject,
      campaign: data.campaign,
      tags: [],
      sentAt: new Date(),
    },
  });
}
```

---

### 5. EmailEvent

Tracks email engagement (delivered, opened, clicked, bounced).

```prisma
model EmailEvent {
  id            String       @id @default(cuid())
  messageId     String
  message       EmailMessage @relation(fields: [messageId], references: [id], onDelete: Cascade)

  eventType     String   // 'delivered', 'opened', 'clicked', 'bounced', 'complained'

  // For clicks
  clickedUrl    String?

  // Metadata
  userAgent     String?
  ipAddress     String?

  timestamp     DateTime @default(now())
}
```

**Event Types:**

| Type | Description | Triggers Unified Event? |
|------|-------------|-------------------------|
| `delivered` | Email successfully delivered | No |
| `opened` | Email opened by recipient | Yes (`email_opened`) |
| `clicked` | Link clicked in email | Yes (`email_clicked`) |
| `bounced` | Email bounced | No |
| `complained` | Marked as spam | No |

**Usage Example:**

```typescript
// Track email open
async function trackEmailOpen(messageId: string, userAgent?: string) {
  await prisma.emailEvent.create({
    data: {
      messageId,
      eventType: 'opened',
      userAgent,
      timestamp: new Date(),
    },
  });

  // Also track as unified event
  const message = await prisma.emailMessage.findUnique({
    where: { id: messageId },
  });

  if (message) {
    await trackUnifiedEvent({
      personId: message.personId,
      eventName: 'email_opened',
      source: 'email',
      properties: {
        messageId,
        campaign: message.campaign,
      },
    });
  }
}
```

---

## Subscription & Revenue Tables

### 6. PersonSubscription

Snapshot of subscription status from Stripe.

```prisma
model PersonSubscription {
  id                String   @id @default(cuid())
  personId          String
  person            Person   @relation(fields: [personId], references: [id], onDelete: Cascade)

  // Stripe data
  stripeCustomerId      String
  stripeSubscriptionId  String   @unique
  stripePriceId         String

  // Status
  status            String   // 'active', 'canceled', 'past_due', 'trialing'
  plan              String   // 'FREE', 'PRO', 'BUSINESS'
  mrr               Decimal  @db.Decimal(10, 2)

  // Dates
  currentPeriodStart DateTime
  currentPeriodEnd   DateTime
  cancelAt           DateTime?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

**Usage Example:**

```typescript
// Upsert subscription from Stripe webhook
async function syncSubscription(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;

  const person = await findPersonByStripeId(subscription.customer as string);
  if (!person) return;

  await prisma.personSubscription.upsert({
    where: { stripeSubscriptionId: subscription.id },
    update: {
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      updatedAt: new Date(),
    },
    create: {
      personId: person.id,
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0].price.id,
      status: subscription.status,
      plan: getPlanFromPriceId(subscription.items.data[0].price.id),
      mrr: (subscription.items.data[0].price.unit_amount || 0) / 100,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });
}
```

---

### 7. Deal

Tracks sales/revenue opportunities.

```prisma
model Deal {
  id         String   @id @default(cuid())
  personId   String
  person     Person   @relation(fields: [personId], references: [id], onDelete: Cascade)

  dealType   String   // 'subscription', 'one_time', 'upsell'
  amount     Decimal  @db.Decimal(10, 2)
  currency   String   @default("USD")

  status     String   // 'open', 'won', 'lost'

  wonAt      DateTime?
  createdAt  DateTime @default(now())
}
```

**Usage Example:**

```typescript
// Create deal when subscription starts
async function createSubscriptionDeal(personId: string, amount: number) {
  await prisma.deal.create({
    data: {
      personId,
      dealType: 'subscription',
      amount,
      currency: 'USD',
      status: 'won',
      wonAt: new Date(),
    },
  });
}
```

---

## Segmentation Tables

### 8. PersonFeatures

Computed behavioral features for segmentation.

```prisma
model PersonFeatures {
  id       String @id @default(cuid())
  personId String @unique
  person   Person @relation(fields: [personId], references: [id], onDelete: Cascade)

  // Behavioral features
  activeDays   Int @default(0)
  coreActions  Int @default(0)
  pricingViews Int @default(0)
  emailOpens   Int @default(0)
  emailClicks  Int @default(0)

  // Product-specific
  lettersCreated   Int @default(0)
  lettersSent      Int @default(0)
  templatesCreated Int @default(0)
  recipientsAdded  Int @default(0)

  // Time-based
  daysSinceSignup     Int @default(0)
  daysSinceLastActive Int @default(0)

  // Computed at
  computedAt DateTime @default(now())
}
```

**Features Explained:**

| Feature | Calculation | Use Case |
|---------|-------------|----------|
| `activeDays` | Count of unique days with events | Identify power users |
| `coreActions` | Count of key events (letter_sent) | Measure engagement |
| `pricingViews` | Count of pricing page views | Identify warm leads |
| `emailOpens` | Count of email opens | Email engagement |
| `daysSinceSignup` | Days since firstSeenAt | User lifecycle stage |
| `daysSinceLastActive` | Days since lastSeenAt | Churn risk |

**Usage Example:**

```typescript
// Compute features for a person
async function computePersonFeatures(personId: string) {
  const person = await prisma.person.findUnique({
    where: { id: personId },
    include: {
      unifiedEvents: {
        where: {
          timestamp: {
            gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
          },
        },
      },
    },
  });

  if (!person) return;

  const features = {
    activeDays: new Set(
      person.unifiedEvents.map(e => e.timestamp.toISOString().split('T')[0])
    ).size,
    coreActions: person.unifiedEvents.filter(e =>
      ['letter_sent', 'subscription_started'].includes(e.eventName)
    ).length,
    pricingViews: person.unifiedEvents.filter(e =>
      e.eventName === 'pricing_view'
    ).length,
    emailOpens: person.unifiedEvents.filter(e =>
      e.eventName === 'email_opened'
    ).length,
    lettersSent: person.unifiedEvents.filter(e =>
      e.eventName === 'letter_sent'
    ).length,
    daysSinceSignup: Math.floor(
      (Date.now() - person.firstSeenAt.getTime()) / (24 * 60 * 60 * 1000)
    ),
    daysSinceLastActive: Math.floor(
      (Date.now() - person.lastSeenAt.getTime()) / (24 * 60 * 60 * 1000)
    ),
  };

  await prisma.personFeatures.upsert({
    where: { personId },
    update: {
      ...features,
      computedAt: new Date(),
    },
    create: {
      personId,
      ...features,
    },
  });
}
```

---

### 9. Segment

Defines audience segments based on rules.

```prisma
model Segment {
  id          String @id @default(cuid())
  name        String @unique
  description String

  // Segment rules (JSON query)
  rules       Json

  // Automation
  enabled      Boolean @default(true)
  actionType   String? // 'email', 'meta_audience', 'webhook'
  actionConfig Json?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  members     SegmentMember[]
}
```

**Segment Rules Format:**

```typescript
interface SegmentRules {
  operator: 'AND' | 'OR';
  conditions: SegmentCondition[];
}

interface SegmentCondition {
  field: string;  // e.g., 'features.daysSinceLastActive'
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains';
  value: any;
}
```

**Example Segments:**

```json
{
  "name": "At-Risk Churners",
  "rules": {
    "operator": "AND",
    "conditions": [
      {
        "field": "features.daysSinceLastActive",
        "operator": "gt",
        "value": 60
      },
      {
        "field": "features.lettersSent",
        "operator": "gt",
        "value": 0
      }
    ]
  },
  "actionType": "email",
  "actionConfig": {
    "campaign": "win-back",
    "template": "we-miss-you"
  }
}
```

---

### 10. SegmentMember

Tracks segment membership for fast lookups.

```prisma
model SegmentMember {
  id        String  @id @default(cuid())
  segmentId String
  segment   Segment @relation(fields: [segmentId], references: [id], onDelete: Cascade)
  personId  String
  person    Person  @relation(fields: [personId], references: [id], onDelete: Cascade)

  enteredAt DateTime  @default(now())
  exitedAt  DateTime?

  @@unique([segmentId, personId])
  @@index([personId])
  @@index([segmentId])
}
```

**Usage Example:**

```typescript
// Add person to segment
async function addToSegment(personId: string, segmentId: string) {
  await prisma.segmentMember.upsert({
    where: {
      segmentId_personId: {
        segmentId,
        personId,
      },
    },
    update: {
      exitedAt: null, // Re-enter if previously exited
    },
    create: {
      segmentId,
      personId,
      enteredAt: new Date(),
    },
  });
}

// Remove person from segment
async function removeFromSegment(personId: string, segmentId: string) {
  await prisma.segmentMember.update({
    where: {
      segmentId_personId: {
        segmentId,
        personId,
      },
    },
    data: {
      exitedAt: new Date(),
    },
  });
}
```

---

## Data Flow Examples

### Example 1: User Signup Flow

```
1. Anonymous user visits landing page
   → UnifiedEvent: landing_view (personId: null, sessionId: abc123)

2. User views pricing
   → UnifiedEvent: pricing_view

3. User signs up
   → Person created (email: user@example.com)
   → IdentityLink: source='user', externalId=userId
   → UnifiedEvent: signup_completed

4. PostHog identifies user
   → IdentityLink: source='posthog', externalId=postHogId

5. Retroactive attribution
   → Update previous anonymous events with personId
```

### Example 2: Email Campaign Flow

```
1. Segment evaluated: "Users who haven't sent a letter in 7 days"
   → SegmentMember records created

2. Email campaign triggered for segment
   → EmailMessage records created

3. User opens email
   → EmailEvent: eventType='opened'
   → UnifiedEvent: email_opened

4. User clicks link
   → EmailEvent: eventType='clicked'
   → UnifiedEvent: email_clicked
   → Session tracked with utm_campaign

5. User converts (sends letter)
   → UnifiedEvent: letter_sent
   → Attribution: credited to email campaign
```

### Example 3: Subscription Flow

```
1. User views pricing
   → UnifiedEvent: pricing_view

2. User starts checkout
   → UnifiedEvent: checkout_started

3. Stripe checkout session completed
   → Deal created: status='won'
   → PersonSubscription created
   → IdentityLink: source='stripe', externalId=customerId
   → UnifiedEvent: subscription_started

4. Background job computes features
   → PersonFeatures updated: activeDays, coreActions, etc.

5. Segment membership updated
   → Added to "Active Subscribers"
   → Removed from "Free Tier Users"
```

---

## Indexes & Performance

### Indexed Fields

All tables include strategic indexes for fast queries:

```sql
-- Person
CREATE INDEX idx_person_email ON "Person"(email);
CREATE INDEX idx_person_last_seen ON "Person"("lastSeenAt");

-- IdentityLink
CREATE UNIQUE INDEX idx_identity_source_external ON "IdentityLink"(source, "externalId");
CREATE INDEX idx_identity_person ON "IdentityLink"("personId");

-- UnifiedEvent
CREATE INDEX idx_event_person_name ON "UnifiedEvent"("personId", "eventName");
CREATE INDEX idx_event_timestamp ON "UnifiedEvent"(timestamp);
CREATE INDEX idx_event_source ON "UnifiedEvent"(source);

-- EmailMessage
CREATE INDEX idx_email_person ON "EmailMessage"("personId");
CREATE INDEX idx_email_campaign ON "EmailMessage"(campaign);
CREATE INDEX idx_email_sent ON "EmailMessage"("sentAt");

-- SegmentMember
CREATE UNIQUE INDEX idx_segment_member_unique ON "SegmentMember"("segmentId", "personId");
CREATE INDEX idx_segment_member_person ON "SegmentMember"("personId");
```

### Query Optimization Tips

1. **Always filter by indexed fields first:**
   ```typescript
   // Good
   where: { personId: '...', eventName: 'letter_sent' }

   // Bad (eventName not indexed alone)
   where: { eventName: 'letter_sent' }
   ```

2. **Use time-range filters for large tables:**
   ```typescript
   where: {
     timestamp: {
       gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
     },
   }
   ```

3. **Batch updates for PersonFeatures:**
   ```typescript
   // Compute features for all persons in batches of 100
   const personIds = await prisma.person.findMany({
     select: { id: true },
   });

   for (let i = 0; i < personIds.length; i += 100) {
     const batch = personIds.slice(i, i + 100);
     await Promise.all(
       batch.map(p => computePersonFeatures(p.id))
     );
   }
   ```

---

## Migration Strategy

### Phase 1: Schema Deployment (GDP-001) ✅

- [x] Add new tables to Prisma schema
- [x] Generate Prisma client
- [ ] Run migration in development
- [ ] Test queries
- [ ] Deploy to production

### Phase 2: Identity Linking (GDP-002)

- [ ] Create `IdentityLink` records for existing users
- [ ] Link User → Person
- [ ] Link Stripe customers → Person

### Phase 3: Event Migration (GDP-003)

- [ ] Backfill UnifiedEvent from existing Event table
- [ ] Set up real-time event ingestion
- [ ] Deprecate old Event usage

### Phase 4: Feature Computation (GDP-011)

- [ ] Compute PersonFeatures for all persons
- [ ] Set up daily background job
- [ ] Monitor computation performance

### Phase 5: Segmentation (GDP-012)

- [ ] Create initial segments
- [ ] Evaluate segment membership
- [ ] Set up automation triggers

---

## Next Steps

### After GDP-001 ✅

**GDP-002:** Person & Identity Tables
- Implement identity resolution logic
- Create helper functions for linking identities
- Backfill data from User table

**GDP-003:** Unified Events Table
- Implement event ingestion pipeline
- Migrate existing events
- Update tracking SDK to use UnifiedEvent

**GDP-004-005:** Email Event Tracking
- Set up Resend webhook handler
- Store EmailMessage and EmailEvent records
- Link to Person via email

---

## Resources

- **Prisma Schema:** `prisma/schema.prisma`
- **PRD:** `docs/PRD_GROWTH_DATA_PLANE.md`
- **Feature List:** `feature_list.json` (GDP-001 to GDP-012)

---

**Last Updated:** January 26, 2026
**Maintained By:** Engineering Team
**Next Review:** February 15, 2026
