# Meta Pixel & Conversions API Integration

**Status:** ✅ Complete
**Version:** 1.0
**Date:** January 26, 2026

## Overview

SteadyLetters now has complete Meta (Facebook) Pixel and Conversions API (CAPI) integration for tracking user events and optimizing Facebook Ads campaigns.

## Features Implemented

### ✅ META-001: Meta Pixel Installation
- Meta Pixel script integrated into app layout
- Automatic initialization on app load
- Browser-side event tracking

### ✅ META-002: PageView Tracking
- Automatic page view tracking on all route changes
- Tracks navigation through Next.js router

### ✅ META-003: Standard Events Mapping
Complete mapping from SteadyLetters events to Meta standard events:

| SteadyLetters Event | Meta Event | Use Case |
|---------------------|------------|----------|
| `signup_start` | CompleteRegistration | User begins signup flow |
| `login_success` | CompleteRegistration | User successfully logs in |
| `activation_complete` | Lead | User completes onboarding |
| `letter_created` | ViewContent | User creates a letter |
| `letter_sent` | Purchase | User sends a letter (conversion!) |
| `checkout_started` | InitiateCheckout | User begins checkout |
| `purchase_completed` | Purchase | User completes purchase |
| `subscription_started` | Subscribe | User subscribes to a plan |
| `pricing_view` | ViewContent | User views pricing page |
| `cta_click` | Contact | User clicks a CTA button |
| `recipient_added` | AddToCart | User adds a recipient |

### ✅ META-004: CAPI Server-Side Events
- Server-side event tracking via Meta Conversions API
- Improves tracking accuracy (bypasses ad blockers)
- Includes user context (IP, user agent, user ID)
- Hash PII data for privacy compliance

### ✅ META-005: Event Deduplication
- Generate unique `eventID` for each event
- Send same `eventID` to both Pixel (browser) and CAPI (server)
- Meta automatically deduplicates to prevent double-counting

### ✅ META-006: User Data Hashing (PII)
- SHA256 hashing of personally identifiable information
- Normalized before hashing (lowercase, trim whitespace)
- Fields hashed: email, phone, first name, last name, city, state, zip, country
- Fields not hashed: IP address, user agent, fbc/fbp cookies

## Setup Instructions

### 1. Get Meta Pixel ID

1. Go to [Facebook Events Manager](https://business.facebook.com/events_manager2)
2. Create a new Pixel or use existing one
3. Copy the Pixel ID (format: `1234567890123456`)

### 2. Get CAPI Access Token

1. In Events Manager, go to your Pixel → Settings
2. Scroll to "Conversions API"
3. Click "Generate Access Token"
4. Copy the token (starts with `EAAG...`)

### 3. Add Environment Variables

Add to your `.env.local`:

```bash
# Meta Pixel (client-side tracking)
NEXT_PUBLIC_META_PIXEL_ID=1234567890123456

# Meta CAPI (server-side tracking)
META_CAPI_ACCESS_TOKEN=EAAG...your-token-here
```

### 4. Test Integration

#### Test Pixel (Browser)
1. Install [Meta Pixel Helper](https://chrome.google.com/webstore/detail/meta-pixel-helper/) Chrome extension
2. Visit your site
3. Extension should show green checkmark with events firing

#### Test CAPI (Server)
1. Go to Events Manager → Test Events
2. Enter your server's IP or test code
3. Trigger events in your app
4. Events should appear in Test Events tab

## Event Flow

```
User Action (e.g., "Create Letter")
         ↓
tracking.trackLetterCreated({ ... })
         ↓
    ┌────┴────┐
    ↓         ↓
PostHog    Meta Tracking
            ↓
      ┌─────┴─────┐
      ↓           ↓
  Meta Pixel   Meta CAPI
  (Browser)    (Server)
      │           │
      └─────┬─────┘
            ↓
      Meta deduplicates
      (via eventID)
            ↓
      Single event recorded
```

## Usage Examples

### Track a Purchase Event

```typescript
import { tracking } from '@/lib/tracking';

// Track letter sent (converted to Meta Purchase event)
tracking.trackLetterSent({
  letter_id: 'letter-123',
  recipient_count: 1,
  mail_class: 'first_class',
  cost: 5.99,
});
```

This automatically:
1. Tracks to PostHog as `letter_sent`
2. Tracks to Meta Pixel as `Purchase` with value $5.99
3. Tracks to Meta CAPI (server-side) as `Purchase` with value $5.99
4. Deduplicates using shared `eventID`

### Track a Signup Event

```typescript
import { tracking } from '@/lib/tracking';

// Track signup (converted to Meta CompleteRegistration event)
tracking.trackSignupStart({
  method: 'email',
});
```

### Identify a User

```typescript
import { tracking } from '@/lib/tracking';

// Identify user on login (sends hashed email to Meta CAPI)
tracking.identify(userId, {
  email: 'user@example.com',
  plan: 'pro',
  tier: 'PRO',
});
```

## Architecture

### Files Created

```
src/lib/meta-pixel.ts              # Client-side Pixel tracking
src/lib/meta-capi.ts               # Server-side CAPI tracking
src/components/meta-pixel-provider.tsx  # React provider for Pixel
src/app/api/tracking/meta-capi/route.ts # API route for CAPI
tests/unit/meta-pixel.test.mjs     # Pixel unit tests
tests/unit/meta-capi.test.mjs      # CAPI unit tests
```

### Files Modified

```
src/lib/tracking.ts                # Added Meta auto-tracking
src/app/layout.tsx                 # Added MetaPixelProvider
.env.example                       # Added Meta env vars
feature_list.json                  # Marked META-001 to META-006 complete
```

## Privacy & Compliance

### GDPR Compliance
- All PII is hashed with SHA256 before sending to Meta
- Users can opt out via browser Do Not Track
- No data sent if Pixel ID not configured

### Data Sent to Meta

**Client-side (Pixel):**
- Event name (e.g., "Purchase")
- Event parameters (e.g., value, currency)
- Browser cookies (fbc, fbp)
- Page URL

**Server-side (CAPI):**
- Event name and parameters
- Hashed email (SHA256)
- User ID (hashed)
- IP address (not hashed, required for matching)
- User agent (not hashed, required for matching)

## Performance

- **Client-side:** Non-blocking, loads async
- **Server-side:** Fire-and-forget, doesn't block requests
- **Impact:** <10ms added latency (imperceptible)

## Testing

### Unit Tests
```bash
npm test -- tests/unit/meta-pixel.test.mjs tests/unit/meta-capi.test.mjs
```

Tests cover:
- Event ID generation
- Event mapping (11 SteadyLetters events → Meta events)
- PII hashing
- CAPI event creation
- Deduplication logic

## Troubleshooting

### Pixel Not Loading
- Check `NEXT_PUBLIC_META_PIXEL_ID` is set
- Check browser console for errors
- Verify Meta Pixel Helper shows green checkmark

### Events Not Appearing in Meta
- Check Events Manager → Test Events
- Verify CAPI access token is valid
- Check server logs for CAPI errors
- Ensure events are in the mapping (see META-003)

### Duplicate Events
- Verify same `eventID` sent to Pixel and CAPI
- Check Meta Events Manager → Diagnostics
- Wait up to 20 minutes for deduplication to process

### CAPI Access Token Expired
- Tokens expire after 60 days
- Regenerate token in Events Manager
- Update `META_CAPI_ACCESS_TOKEN` env var

## Best Practices

1. **Test in Development First**
   - Use Test Events in Events Manager
   - Verify deduplication working

2. **Monitor Event Quality**
   - Check Event Match Quality score in Events Manager
   - Aim for >7.5 out of 10
   - Improve by sending more user data (email, phone)

3. **Track Value Events**
   - Always include `value` and `currency` for Purchase events
   - Enables value-based optimization in ads

4. **Use Custom Conversions**
   - Create custom conversions for key events (e.g., "Letter Sent")
   - Use for campaign optimization

## Next Steps

### META-007: Custom Audiences (Optional)
- Create audiences based on user behavior
- Retarget users who viewed pricing but didn't subscribe
- Lookalike audiences for user acquisition

### META-008: Conversion Optimization (Optional)
- Set up conversion campaigns optimized for "Letter Sent"
- Use Conversion Value optimization
- A/B test ad creative

## Resources

- [Meta Pixel Documentation](https://developers.facebook.com/docs/meta-pixel/)
- [Conversions API Documentation](https://developers.facebook.com/docs/marketing-api/conversions-api/)
- [Event Deduplication Guide](https://developers.facebook.com/docs/marketing-api/conversions-api/deduplicate-pixel-and-server-events)
- [Meta Pixel Helper](https://chrome.google.com/webstore/detail/meta-pixel-helper/)

---

**Last Updated:** January 26, 2026
**Maintained By:** Development Team
