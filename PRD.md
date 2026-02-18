# SteadyLetters — Product Requirements Document (PRD)

## 1. Product Overview

**SteadyLetters** is an iOS app that lets users compose, personalize, and send real handwritten letters, postcards, and greeting cards through AI-powered generation and the Thanks.io fulfillment API.

**Vision:** Make sending physical mail as easy as sending a text message.

**Target Users:**
- Individuals who want to send thoughtful, personal mail
- Small businesses for customer appreciation campaigns
- People who want to maintain relationships through physical letters

---

## 2. Current State (v1.0 — MVP)

### ✅ Shipped Features

| Feature | Status | Notes |
|---------|--------|-------|
| Email auth (sign-up, sign-in, forgot-password) | ✅ Done | Supabase Auth |
| AI letter generation (GPT-4) | ✅ Done | Occasion + tone + key points |
| AI image generation (DALL-E 3) | ✅ Done | For card fronts |
| Voice-to-letter transcription (Whisper) | ✅ Done | 60s timeout, empty speech detection |
| Recipient management (CRUD) | ✅ Done | Mapped to Prisma DB schema |
| Send postcards, letters, greeting cards | ✅ Done | Thanks.io API |
| Order tracking with detail view | ✅ Done | Real Thanks.io statuses |
| Template library (save/reuse letters) | ✅ Done | Filter by occasion |
| Subscription tiers (Free/Pro/Business) | ✅ Done | RevenueCat ready |
| Usage tracking & limits | ✅ Done | Per-tier monthly limits |
| Settings (theme, profile, usage stats) | ✅ Done | Light/dark/system |
| Push notifications | ✅ Done | Order delivery alerts |
| Error boundary | ✅ Done | Graceful crash recovery |
| Unified event tracking | ✅ Done | PostHog + Meta Ads + RevenueCat |
| iOS simulator dev build | ✅ Done | expo-dev-client |

### 🔧 Infrastructure

| Component | Provider | Status |
|-----------|----------|--------|
| Backend / DB | Supabase (local + cloud) | ✅ |
| Auth | Supabase Auth | ✅ |
| Mail Fulfillment | Thanks.io API v2 | ✅ |
| AI Text | OpenAI GPT-4 | ✅ |
| AI Images | OpenAI DALL-E 3 | ✅ |
| AI Audio | OpenAI Whisper | ✅ |
| Subscriptions | RevenueCat | ✅ Integrated, needs App Store products |
| Analytics | PostHog | ✅ Integrated, needs API key |
| Ad Attribution | Meta Ads (FBSDK) | ✅ Integrated, needs App ID |
| Push Notifications | Expo Notifications | ✅ |

---

## 3. Roadmap

### v1.1 — Launch Polish (Next 2 weeks)

| Feature | Priority | Est. |
|---------|----------|------|
| **App Store Connect setup** — create app listing, screenshots, metadata | P0 | 1 day |
| **RevenueCat products** — create in App Store Connect, link in RC dashboard | P0 | 1 day |
| **Cloud Supabase** — migrate from local to hosted, apply migrations | P0 | 0.5 day |
| **Real splash screen** — branded loading with app logo | P1 | 0.5 day |
| **Onboarding flow** — 3-screen walkthrough for first-time users | P1 | 1 day |
| **Image picker for card fronts** — select from gallery or take photo | P1 | 0.5 day |
| **Return address management** — persist sender address in settings | P1 | 0.5 day |
| **TestFlight beta** — first external build for beta testers | P0 | 0.5 day |

### v1.2 — Growth Features (Weeks 3-6)

| Feature | Priority | Est. |
|---------|----------|------|
| **Batch send** — send same letter to multiple recipients at once | P1 | 2 days |
| **Scheduled send** — pick a future date for delivery | P2 | 1 day |
| **Address book import** — import contacts from phone | P1 | 1 day |
| **Smart recipient suggestions** — "You haven't written to X in 30 days" | P2 | 1 day |
| **Letter preview** — visual preview of final printed letter | P1 | 2 days |
| **Share template** — share templates via deep link | P2 | 1 day |
| **Referral system** — invite friends, earn free letters | P2 | 2 days |
| **Widget** — iOS home screen widget showing upcoming sends | P3 | 1 day |

### v1.3 — Business Features (Weeks 7-10)

| Feature | Priority | Est. |
|---------|----------|------|
| **CSV upload** — bulk import recipients from spreadsheet | P1 | 1 day |
| **Campaign manager** — create, schedule, track multi-recipient campaigns | P1 | 3 days |
| **Custom branding** — upload business logo for card headers | P2 | 1 day |
| **CRM integrations** — Zapier/webhook triggers for sending letters | P2 | 2 days |
| **Analytics dashboard** — sent/delivered/opened rates per campaign | P2 | 2 days |
| **Team accounts** — invite team members, shared recipient lists | P3 | 3 days |
| **API access** — REST API for programmatic letter sending | P3 | 2 days |

### v2.0 — Platform Expansion

| Feature | Priority | Est. |
|---------|----------|------|
| **Android app** — Expo makes this mostly free | P1 | 2 days |
| **Web app** — already have Next.js landing page, add full web client | P2 | 5 days |
| **International shipping** — expand beyond US/Canada | P2 | 1 day |
| **Handwriting upload** — scan your own handwriting as a font | P3 | 3 days |
| **AI tone matching** — analyze past letters to match your voice | P3 | 2 days |

---

## 4. Feature Specifications

### 4.1 Onboarding Flow (v1.1)

**Screens:**
1. **Welcome** — "Send real handwritten letters in minutes" + hero illustration
2. **How it works** — 3 steps: Write → Personalize → Send
3. **Choose your plan** — Show free tier + upsell pro

**Behavior:**
- Show only on first launch (store flag in AsyncStorage)
- Skip button on all screens
- Deep link to paywall from step 3
- Track `onboarding_started`, `onboarding_completed`, `onboarding_skipped`

### 4.2 Batch Send (v1.2)

**UX:**
- On send screen, change "Select Recipient" to multi-select
- Show count badge: "Sending to 5 recipients"
- Confirm screen shows total cost (unit price × count)
- Progress bar during batch send

**Technical:**
- Thanks.io supports batch via array of recipients
- Create one Order per recipient for tracking
- Parallel API calls with `Promise.allSettled`
- Report partial failures: "4/5 sent successfully"

### 4.3 Campaign Manager (v1.3)

**Data model:**
```
Campaign {
  id, name, status (draft/scheduled/sending/sent),
  template_id, recipient_list_ids[],
  scheduled_date, created_at,
  sent_count, failed_count, total_count
}
```

**Screens:**
- Campaign list (with status badges)
- Campaign builder (select template → select recipients → schedule)
- Campaign detail (progress, per-recipient status)

---

## 5. Subscription Tiers

| Feature | Free | Pro ($29/mo) | Business ($99/mo) |
|---------|------|-------------|-------------------|
| Letter generations/mo | 5 | 50 | Unlimited |
| Image generations/mo | 3 | 25 | 100 |
| Letters sent/mo | 2 | 20 | 100 |
| Product types | Postcards | + Letters, Greeting Cards | + All types |
| Templates | View only | Save custom | + Team shared |
| Batch send | — | Up to 10 | Up to 100 |
| Campaigns | — | — | ✅ |
| CSV import | — | — | ✅ |
| Priority support | — | ✅ | ✅ |
| Custom branding | — | — | ✅ |

---

## 6. Technical Architecture

```
┌─────────────────────────────────────────┐
│              iOS App (Expo)              │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌────────┐ │
│  │ Auth │ │ Bill │ │ Anal │ │ Theme  │ │
│  │Provdr│ │Provdr│ │Provdr│ │Provider│ │
│  └──┬───┘ └──┬───┘ └──┬───┘ └────────┘ │
│     │        │        │                 │
│  ┌──┴────────┴────────┴──┐              │
│  │    services/events.ts │ ← Unified    │
│  └──┬────────┬───────┬───┘   tracking   │
│     │        │       │                  │
└─────┼────────┼───────┼──────────────────┘
      │        │       │
  ┌───┴──┐ ┌──┴───┐ ┌─┴──────┐
  │Supa  │ │OpenAI│ │Thanks  │
  │base  │ │ API  │ │.io API │
  └──────┘ └──────┘ └────────┘

  ┌──────────────────────────┐
  │     Third-Party SDKs     │
  │ RevenueCat │ PostHog │ FB│
  └──────────────────────────┘
```

---

## 7. Success Metrics

### North Star: Monthly Active Senders (users who send ≥1 letter/month)

| Metric | Target (Month 1) | Target (Month 6) |
|--------|------------------|-------------------|
| Downloads | 500 | 5,000 |
| Sign-ups | 200 | 2,500 |
| Monthly Active Senders | 50 | 500 |
| Free → Pro conversion | 5% | 10% |
| Pro → Business conversion | — | 3% |
| MRR | $500 | $5,000 |
| Avg. letters/user/month | 2 | 4 |
| D7 retention | 30% | 45% |
| NPS | 40+ | 50+ |

---

## 8. App Store Listing

**Name:** SteadyLetters — Send Real Mail
**Subtitle:** AI-Powered Handwritten Letters
**Category:** Lifestyle > Productivity

**Description:**
> Send real, handwritten letters, postcards, and greeting cards — right from your phone. SteadyLetters uses AI to help you write the perfect message, then prints and mails it for you.
>
> ✉️ **Write with AI** — Tell us the occasion, tone, and key points. Our AI crafts a beautiful, personal letter.
>
> 🎤 **Speak your letter** — Record your thoughts and we'll transcribe them into a letter.
>
> 🎨 **Beautiful designs** — Generate unique card artwork with AI, or use your own photos.
>
> 📬 **Real mail, real impact** — We print your letter in real handwriting and mail it to your recipient.
>
> 📊 **Track delivery** — See when your letter is printed, shipped, and delivered.

**Keywords:** handwritten letters, send mail, postcards, greeting cards, AI letter writer, mail app, thank you cards, snail mail
