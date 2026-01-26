# Meta Custom Audiences Setup Guide

**Status:** ✅ Complete (META-007)
**Version:** 1.0
**Date:** January 26, 2026

## Overview

Meta Custom Audiences allow you to create targeted audience segments based on user behavior tracked through Meta Pixel and Conversions API. This enables precise ad targeting, retargeting campaigns, and lookalike audience creation for user acquisition.

## Prerequisites

Before setting up custom audiences, ensure:

- ✅ META-001 to META-006 complete (Pixel and CAPI tracking)
- ✅ Meta Pixel firing events correctly
- ✅ Access to Meta Ads Manager
- ✅ Facebook Business Manager account with admin permissions

## What Are Custom Audiences?

Custom Audiences are groups of people who have interacted with your business. You can create audiences based on:

1. **Website Activity** - People who visited specific pages or took specific actions
2. **Event-Based Behavior** - Users who triggered specific Pixel events
3. **Engagement** - Users at different stages of the customer journey
4. **Value** - High-value customers vs. casual browsers

## Pre-Configured Audience Segments

SteadyLetters has 12 pre-configured audience segments defined in `src/config/meta-audiences.ts`:

### Acquisition Audiences

| Audience | Description | Use Case |
|----------|-------------|----------|
| **Warm Leads** | Viewed pricing, haven't signed up | Retarget with signup incentive ads |
| **Landing Visitors** | Visited site, didn't view pricing | Top-of-funnel awareness campaigns |

### Activation Audiences

| Audience | Description | Use Case |
|----------|-------------|----------|
| **Signed Up, Not Activated** | Registered but haven't created letter | Onboarding nudges |
| **Created, Didn't Send** | Created letter, didn't send | Completion campaigns |

### Monetization Audiences

| Audience | Description | Use Case |
|----------|-------------|----------|
| **Free Tier Active Users** | Active but not subscribed | Promote paid benefits |
| **Checkout Abandoners** | Started checkout, didn't finish | Retarget with urgency/discount |

### Retention Audiences

| Audience | Description | Use Case |
|----------|-------------|----------|
| **Active Senders** | Sent letter in last 30 days | Upsells, feature announcements |
| **At-Risk Churners** | Inactive for 60+ days | Re-engagement campaigns |

### Value-Based Audiences

| Audience | Description | Use Case |
|----------|-------------|----------|
| **High-Value Customers** | 5+ letters in 90 days | VIP treatment, referrals |
| **Active Subscribers** | Paid subscription active | Premium features, upsells |

### Lookalike Source Audiences

| Audience | Description | Use Case |
|----------|-------------|----------|
| **Letter Converters** | Sent first letter | Source for acquisition lookalikes |
| **Paying Customers** | Completed purchase/subscription | High-intent lookalikes |

## How to Create Custom Audiences in Meta

### Step 1: Access Audiences

1. Go to [Meta Ads Manager](https://business.facebook.com/adsmanager)
2. Click **Audiences** in the left menu (or **All Tools** → **Audiences**)
3. Click **Create Audience** → **Custom Audience**
4. Select **Website** as the source

### Step 2: Choose Your Pixel

1. Select your SteadyLetters Pixel (configured in META-001)
2. Choose **Event** as the audience type

### Step 3: Define Audience Rules

Let's create the "Warm Leads" audience as an example:

#### Option A: Using the UI

1. **Include people who meet:**
   - Event: `ViewContent`
   - Parameter: `content_type` equals `pricing`
   - In the last: `30 days`

2. **Exclude people who meet:**
   - Event: `CompleteRegistration`
   - In the last: `30 days`

3. **Name:** `SL - Warm Leads`
4. **Description:** `Viewed pricing but haven't signed up`

#### Option B: Using Audience Definition Export

You can export audience definitions from the configuration:

```typescript
import { exportAudienceDefinition } from '@/config/meta-audiences';

// Export JSON for API or reference
const audienceDef = exportAudienceDefinition('warm-leads');
console.log(audienceDef);
```

### Step 4: Set Retention Period

- **Recommended:** 30-180 days depending on audience type
- **Acquisition audiences:** 30 days (shorter intent window)
- **Lookalike sources:** 180 days (larger, more stable)

### Step 5: Save and Monitor

1. Click **Create Audience**
2. Wait 24-48 hours for audience to populate
3. Check **Audience Size** (should be at least 1,000 for ads, 100 for lookalikes)

## Creating All 12 Recommended Audiences

Here's a quick reference for creating each audience:

### 1. Warm Leads
```
Include: ViewContent (content_type = pricing) in 30 days
Exclude: CompleteRegistration in 30 days
```

### 2. Landing Visitors
```
Include: PageView in 14 days
Exclude: ViewContent (content_type = pricing) in 14 days
```

### 3. Signed Up, Not Activated
```
Include: CompleteRegistration in 7 days
Exclude: ViewContent (content_type = letter) in 7 days
```

### 4. Created, Didn't Send
```
Include: ViewContent (content_type = letter) in 14 days
Exclude: Purchase (content_type = letter) in 14 days
```

### 5. Free Tier Active Users
```
Include: Purchase (content_type = letter) in 30 days
Exclude: Subscribe in 30 days
```

### 6. Checkout Abandoners
```
Include: InitiateCheckout in 7 days
Exclude: Purchase in 1 day (after checkout)
```

### 7. Active Senders
```
Include: Purchase (content_type = letter) in 30 days
```

### 8. At-Risk Churners
```
Include: Purchase (content_type = letter) in 90 days
Exclude: Purchase (content_type = letter) in 60 days
```

### 9. High-Value Customers
```
Include: Purchase (content_type = letter) in 90 days
Advanced: Set event count ≥ 5 (in Meta UI)
```

### 10. Active Subscribers
```
Include: Subscribe in 30 days
```

### 11. Letter Converters (Lookalike Source)
```
Include: Purchase (content_type = letter) in 180 days
```

### 12. Paying Customers (Lookalike Source)
```
Include: Subscribe in 180 days
```

## Creating Lookalike Audiences

Once your source audiences (#11 and #12) have at least 100 people:

1. Go to **Audiences** → **Create Audience** → **Lookalike Audience**
2. **Source:** Select "Letter Converters" or "Paying Customers"
3. **Location:** United States (or your target market)
4. **Audience Size:** 1% (most similar) to 10% (broader)
   - Start with 1-2% for best quality
   - Scale to 5-10% once profitable
5. **Name:** `SL - Lookalike - Letter Converters 1%`

### Recommended Lookalike Audiences

- **1% Letter Converters** - Highest quality, coldest prospects
- **1% Paying Customers** - High-intent buyers
- **3% Letter Converters** - Scale audience for lower CPAs
- **5% Letter Converters** - Broad awareness campaigns

## Using Audiences in Ad Campaigns

### Campaign Structure Example

**Campaign 1: Retargeting**
- **Objective:** Conversions (Subscribe)
- **Audience:** Warm Leads + Free Tier Active Users
- **Creative:** Highlight paid plan benefits, testimonials
- **Budget:** $20/day

**Campaign 2: Re-engagement**
- **Objective:** Conversions (Send Letter)
- **Audience:** Created, Didn't Send + Checkout Abandoners
- **Creative:** Urgency messaging, limited-time discount
- **Budget:** $15/day

**Campaign 3: Acquisition**
- **Objective:** Conversions (CompleteRegistration)
- **Audience:** 1-2% Lookalike - Letter Converters
- **Creative:** Value proposition, social proof
- **Budget:** $50/day

**Campaign 4: Win-Back**
- **Objective:** Conversions (Send Letter)
- **Audience:** At-Risk Churners
- **Creative:** "We miss you" messaging, new features
- **Budget:** $10/day

## Best Practices

### Audience Sizing

- **Minimum:** 1,000 people for ad campaigns
- **Ideal:** 10,000+ for stable performance
- **Lookalike Sources:** 100+ (min), 1,000+ (ideal)

If audiences are too small:
- Increase lookback window (e.g., 30 → 60 days)
- Broaden rules (e.g., remove exclusions)
- Wait for more traffic/events

### Refresh and Monitoring

- **Check weekly:** Audience sizes and trends
- **Refresh quarterly:** Update rules based on user behavior changes
- **Test variations:** Different lookback periods, event combinations

### Exclusions

Always exclude converters from upper-funnel campaigns:

```
Campaign: "Sign Up Now"
Audience: Warm Leads
Exclude: Active Subscribers (already converted)
```

### Privacy and Compliance

- All audiences use hashed PII (META-006 ✅)
- Comply with GDPR, CCPA regulations
- Include opt-out mechanisms
- Don't target sensitive categories

## Programmatic Audience Management (Optional)

For advanced use cases, you can use Meta's Marketing API to create/update audiences programmatically:

```typescript
// Example: Create audience via API
const response = await fetch(
  `https://graph.facebook.com/v18.0/act_YOUR_AD_ACCOUNT/customaudiences`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'SL - Warm Leads',
      subtype: 'WEBSITE',
      customer_file_source: 'BOTH_USER_AND_PARTNER_PROVIDED',
      rule: {
        inclusions: {
          operator: 'or',
          rules: [
            {
              event_sources: [{ type: 'pixel', id: 'YOUR_PIXEL_ID' }],
              retention_seconds: 2592000, // 30 days
              filter: {
                operator: 'and',
                filters: [
                  { field: 'event', operator: 'eq', value: 'ViewContent' },
                  { field: 'content_type', operator: 'eq', value: 'pricing' },
                ],
              },
            },
          ],
        },
        exclusions: {
          operator: 'or',
          rules: [
            {
              event_sources: [{ type: 'pixel', id: 'YOUR_PIXEL_ID' }],
              retention_seconds: 2592000,
              filter: {
                field: 'event',
                operator: 'eq',
                value: 'CompleteRegistration',
              },
            },
          ],
        },
      },
      access_token: 'YOUR_ACCESS_TOKEN',
    }),
  }
);
```

**Note:** This requires additional Facebook Marketing API permissions. Most teams will use the Ads Manager UI.

## Measuring Success

### Key Metrics to Track

| Metric | What It Means | Target |
|--------|---------------|--------|
| **Audience Size** | Number of people in audience | 1,000+ |
| **Audience Growth** | Week-over-week % change | +10% |
| **CPM** | Cost per 1,000 impressions | <$15 |
| **CPC** | Cost per click | <$2 |
| **CTR** | Click-through rate | >1.5% |
| **CVR** | Conversion rate | >5% (retargeting) |
| **ROAS** | Return on ad spend | >3x |

### Recommended Dashboards

1. **Ads Manager:** Campaign performance
2. **Events Manager:** Event tracking quality
3. **Audience Insights:** Demographic data
4. **Attribution:** Multi-touch conversion paths

## Troubleshooting

### "Audience Too Small"

- **Solution 1:** Increase lookback window (30 → 60 days)
- **Solution 2:** Simplify rules (remove some exclusions)
- **Solution 3:** Wait for more traffic (need 1,000+ visitors)

### "Audience Not Populating"

- **Check:** Pixel events firing (Meta Pixel Helper)
- **Check:** Events include correct parameters (e.g., `content_type`)
- **Wait:** Audiences can take 24-48 hours to populate

### "Low Event Match Quality"

- **Solution:** Send more user data in CAPI (email, phone)
- **Target:** 7.5+ out of 10 match quality score
- **Impact:** Better attribution, larger audiences

### "High CPAs, Low ROAS"

- **Test:** Different creative (headlines, images, CTAs)
- **Optimize:** Tighten audience (e.g., 30-day vs. 90-day)
- **Adjust:** Bid strategy (lowest cost → cost cap)

## Migration from Other Platforms

If migrating from Google Ads or other platforms:

| Google Ads | Meta Equivalent |
|------------|-----------------|
| Remarketing Lists | Custom Audiences |
| Customer Match | Custom Audience (Customer List) |
| Similar Audiences | Lookalike Audiences |
| In-Market Audiences | Interest Targeting |

## Next Steps

### After META-007 ✅

1. **META-008:** Conversion Optimization
   - Set up value-based bidding
   - Implement Conversion Lift tests
   - A/B test ad creative

2. **Advanced Targeting:**
   - Combine audiences with interests
   - Test detailed targeting expansion
   - Implement dynamic creative optimization

3. **Measurement:**
   - Set up conversion lift studies
   - Implement incrementality testing
   - Track customer LTV by acquisition source

## Resources

- [Meta Custom Audiences Documentation](https://www.facebook.com/business/help/744354708981227)
- [Lookalike Audiences Guide](https://www.facebook.com/business/help/164749007013531)
- [Meta Marketing API](https://developers.facebook.com/docs/marketing-api/)
- [Audience Insights](https://www.facebook.com/business/insights/tools/audience-insights)

## Support

For questions or issues:
- **Meta Support:** [Business Help Center](https://www.facebook.com/business/help)
- **Internal:** Check `src/config/meta-audiences.ts` for audience definitions
- **Pixel Issues:** See `docs/META_PIXEL_INTEGRATION.md`

---

**Last Updated:** January 26, 2026
**Maintained By:** Growth Team
**Next Review:** March 1, 2026
