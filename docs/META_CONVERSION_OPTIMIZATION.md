# Meta Conversion Optimization Guide

**Status:** ✅ Complete (META-008)
**Version:** 1.0
**Date:** January 26, 2026

## Overview

Now that Meta Pixel and CAPI are tracking all key events (META-001 to META-006) and custom audiences are configured (META-007), it's time to optimize your ad campaigns for maximum ROI. This guide covers value-based bidding, conversion optimization strategies, and testing frameworks to improve campaign performance.

## Prerequisites

Before implementing conversion optimization:

- ✅ META-001 to META-006 complete (Pixel, CAPI, deduplication, PII hashing)
- ✅ META-007 complete (Custom audiences configured)
- ✅ Minimum 50 conversion events per week (for algorithm optimization)
- ✅ Active ad campaigns running for at least 7 days
- ✅ Conversion tracking accurate (verified in Meta Events Manager)

## What is Conversion Optimization?

Conversion optimization uses Meta's machine learning algorithms to:

1. **Value Optimization** - Optimize for highest-value customers, not just volume
2. **Bidding Strategies** - Choose optimal bid strategies for your goals
3. **Creative Testing** - Systematically test ad variations to improve performance
4. **Audience Optimization** - Find the best-performing audience segments

## Part 1: Value-Based Bidding

### 1.1 Understanding Value Optimization

SteadyLetters already sends `value` and `predicted_ltv` parameters with conversion events:

```typescript
// From src/lib/meta-pixel.ts and src/lib/meta-capi.ts
case 'letter_sent':
  return {
    event: MetaStandardEvent.Purchase,
    params: {
      value: properties.cost || 0,  // Single letter cost
      currency: 'USD',
      content_type: 'letter',
    },
  };

case 'subscription_started':
  return {
    event: MetaStandardEvent.Subscribe,
    params: {
      value: properties.value || 0,  // Monthly subscription price
      currency: 'USD',
      predicted_ltv: (properties.value || 0) * 12,  // Annual LTV
    },
  };
```

**What Meta Does With This:**
- Optimizes for users likely to generate higher transaction values
- Predicts which users will subscribe (higher LTV)
- Bids more aggressively for high-value prospects

### 1.2 Campaign Setup for Value Optimization

#### Step 1: Access Meta Ads Manager

1. Go to [Meta Ads Manager](https://business.facebook.com/adsmanager)
2. Click **Create** to start a new campaign

#### Step 2: Choose Campaign Objective

- **For Letter Sends:** Select **Sales** (optimizes for Purchase events)
- **For Subscriptions:** Select **Sales** (optimizes for Subscribe events)
- **For Signups:** Select **Leads** (optimizes for CompleteRegistration)

#### Step 3: Set Up Campaign Budget & Bid Strategy

Choose one of these bidding strategies:

| Strategy | When to Use | Best For |
|----------|-------------|----------|
| **Highest Value** | You want to maximize revenue | Mature campaigns with conversion data |
| **Lowest Cost** | You want maximum conversions | New campaigns, building data |
| **Cost Per Result** | You want predictable CPAs | Campaigns with stable performance |
| **ROAS Target** | You want a specific return | Campaigns with 50+ weekly conversions |

**Recommended for SteadyLetters:**

```
Campaign Name: Letter Send - Value Optimization
Objective: Sales
Optimization Event: Purchase (letter_sent)
Bid Strategy: Highest Value
Budget: $50/day
Attribution: 7-day click, 1-day view
```

#### Step 4: Configure Optimization Event

1. In **Ad Set** settings, scroll to **Optimization & Delivery**
2. **Optimization Event:** Select `Purchase` (for letter_sent) or `Subscribe` (for subscriptions)
3. **Conversion Window:** 7-day click, 1-day view (default, recommended)
4. **Delivery Type:** Standard (or Accelerated for time-sensitive campaigns)

#### Step 5: Enable Value Optimization

1. Under **Bid Strategy**, select **Bid Cap** or **ROAS Target**
2. **Optional:** Set minimum ROAS target (e.g., 3.0 = $3 revenue per $1 spent)
3. Meta will now optimize for highest-value conversions

### 1.3 Tracking Value Performance

Monitor these metrics in Ads Manager:

| Metric | What It Means | Target |
|--------|---------------|--------|
| **Purchase ROAS** | Return on ad spend | >3.0x |
| **Cost Per Purchase** | Average cost to acquire one letter send | <$10 |
| **Purchase Conversion Value** | Average revenue per conversion | >$20 |
| **CPA (Cost Per Acquisition)** | Cost to acquire a customer | <$15 |

**Example Calculation:**
```
Ad Spend: $500
Conversions: 50 letters sent
Revenue: $1,500 ($30 avg letter value)
ROAS: $1,500 / $500 = 3.0x ✅
CPA: $500 / 50 = $10 ✅
```

---

## Part 2: Campaign Structure for Optimization

### 2.1 The Conversion Funnel

Structure your campaigns to match the customer journey:

```
┌─────────────────────────────────────────────────────┐
│ STAGE 1: Awareness (Cold Traffic)                   │
│ Objective: Reach                                     │
│ Audience: 1-2% Lookalike - Letter Converters        │
│ Creative: Value proposition, social proof           │
│ Budget: $50/day                                      │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│ STAGE 2: Consideration (Warm Traffic)               │
│ Objective: Traffic                                   │
│ Audience: Landing Visitors, Warm Leads              │
│ Creative: Product demo, testimonials                │
│ Budget: $30/day                                      │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│ STAGE 3: Conversion (Hot Traffic)                   │
│ Objective: Sales                                     │
│ Audience: Created Letter, Checkout Abandoners       │
│ Creative: Urgency, limited-time offers              │
│ Budget: $40/day                                      │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│ STAGE 4: Retention (Existing Customers)             │
│ Objective: Sales                                     │
│ Audience: Active Senders, Free Tier Users           │
│ Creative: Upsell to subscription, new features      │
│ Budget: $20/day                                      │
└─────────────────────────────────────────────────────┘
```

### 2.2 Campaign Naming Convention

Use a consistent naming structure:

```
[Stage]_[Audience]_[Objective]_[Creative]

Examples:
- ACQ_LAL_Letters_1%_Purchase_ValueProp
- RET_FreeTier_Subscribe_Upsell
- CONV_Abandoners_Purchase_Urgency
```

---

## Part 3: A/B Testing Framework

### 3.1 What to Test

Test one variable at a time to isolate impact:

| Element | What to Test | Example |
|---------|--------------|---------|
| **Headline** | Value propositions | "Send Handwritten Letters in Minutes" vs. "AI-Powered Letter Writing" |
| **Image/Video** | Product shots, lifestyle, testimonials | App screenshot vs. person writing letter |
| **CTA** | Button text | "Get Started" vs. "Send Your First Letter Free" |
| **Audience** | Lookalike % sizes | 1% vs. 3% vs. 5% |
| **Copy** | Pain points, benefits | "Save Time" vs. "Build Relationships" |
| **Offer** | Discounts, free trials | "50% Off First Month" vs. "Free Trial" |

### 3.2 Running an A/B Test in Meta

#### Method 1: Campaign Budget Optimization (CBO)

1. Create a campaign with **Campaign Budget Optimization** enabled
2. Create multiple ad sets with different variables
3. Meta automatically allocates budget to best performers

**Example:**

```
Campaign: Letter Send - Headline Test
Budget: $100/day (CBO)
└── Ad Set 1: Headline A "Save Time on Thank You Notes"
└── Ad Set 2: Headline B "AI-Powered Handwritten Letters"
└── Ad Set 3: Headline C "Send Letters, Not Emails"
```

#### Method 2: Meta's A/B Test Tool

1. Go to Ads Manager → **A/B Test**
2. Choose **Variable:** Creative, Audience, Placement, or Delivery Optimization
3. Create two versions
4. Meta splits traffic 50/50 and declares a winner

**Example Test:**

```
Test Name: Lookalike Audience Size
Variable: Audience
Test Duration: 7 days
Budget: $200 total ($100 per variation)

Variation A: 1% Lookalike - Letter Converters
Variation B: 5% Lookalike - Letter Converters

Winner: Variation A (1% LAL)
- CPA: $8 vs. $14
- ROAS: 3.5x vs. 2.1x
```

### 3.3 Testing Best Practices

**Sample Size Requirements:**
- Minimum 50 conversions per variation
- Test for at least 7 days (to capture weekly patterns)
- Don't stop tests early

**Statistical Significance:**
- Wait for 95% confidence level
- Meta shows this automatically in A/B Test tool

**One Variable at a Time:**
- Test headline OR image, not both
- Isolate what's driving performance

---

## Part 4: Conversion Lift Studies

### 4.1 What is a Conversion Lift Study?

A **Conversion Lift Study** measures the incremental impact of your ads by comparing a test group (sees ads) vs. a control group (doesn't see ads).

**Key Question:** "Did the ads cause more conversions, or would those users have converted anyway?"

### 4.2 When to Run a Lift Study

- You have 300+ conversions per week
- Campaign has been running for 30+ days
- You want to measure true incrementality
- You're debating increasing or decreasing budget

### 4.3 Setting Up a Lift Study

#### Step 1: Access Lift Studies

1. Go to [Meta Experiments](https://www.facebook.com/business/measurement/experiments)
2. Click **Create Experiment** → **Conversion Lift**

#### Step 2: Configure Study

```
Study Name: SteadyLetters - Letter Send Lift Test
Objective: Purchase (letter_sent)
Campaign: Select your active Letter Send campaign
Test Group: 90% of audience
Control Group: 10% of audience (holdout, won't see ads)
Duration: 14 days
```

#### Step 3: Run Study

- Meta automatically holds out 10% of your target audience
- After 14 days, compares conversion rates

#### Step 4: Analyze Results

**Example Results:**

```
Test Group (Saw Ads):
- Impressions: 500,000
- Conversions: 200
- Conversion Rate: 0.04%

Control Group (No Ads):
- Impressions: 0 (holdout)
- Conversions: 50 (organic)
- Conversion Rate: 0.02%

Incremental Lift: 100%
Incremental Conversions: 150
Incremental CPA: $10
```

**Interpretation:**
- Your ads doubled the conversion rate
- 75% of conversions were incremental (150/200)
- 25% would have converted anyway (50/200)

### 4.4 Acting on Lift Results

| Lift % | Action |
|--------|--------|
| **>50%** | Excellent! Scale budget, expand to new audiences |
| **20-50%** | Good. Optimize creative, test new audiences |
| **10-20%** | Moderate. Improve targeting, creative, or offers |
| **<10%** | Low incrementality. Reassess strategy, audience, or pause |

---

## Part 5: Creative Optimization

### 5.1 Creative Best Practices

**High-Performing Ad Elements for SteadyLetters:**

| Element | Best Practice | Example |
|---------|---------------|---------|
| **Headline** | Clear value prop in <5 words | "Handwritten Letters. Automated." |
| **Primary Text** | Address pain point + solution | "Skip the handwriting. Keep the personal touch." |
| **CTA** | Action-oriented, specific | "Send Your First Letter Free" |
| **Image** | Show product in use | Hand holding finished letter |
| **Video** | <15 seconds, hook in first 3s | Time-lapse of letter generation |
| **Social Proof** | Testimonials, stats | "10,000+ letters sent this month" |

### 5.2 Dynamic Creative Testing (DCO)

Let Meta automatically test combinations of creative elements:

1. Go to Ad Creation → **Create Ad**
2. Enable **Dynamic Creative**
3. Upload multiple assets:
   - 5 images
   - 5 headlines
   - 5 primary text variations
   - 3 CTAs
4. Meta tests combinations and serves best performers

**Example:**

```
Images:
- App screenshot
- Person writing letter
- Stack of handwritten letters
- Thank you card closeup
- Video demo (15s)

Headlines:
- "Send Handwritten Letters in Minutes"
- "AI-Powered Thank You Notes"
- "Automate Your Gratitude"
- "Handwritten Letters, No Pen Required"
- "Build Relationships at Scale"

CTAs:
- "Get Started"
- "Send First Letter Free"
- "Try It Now"

Meta Tests: 5 × 5 × 3 = 75 combinations
```

### 5.3 Creative Refresh Schedule

Creative fatigue sets in after 7-14 days. Refresh on this schedule:

| Frequency | What to Refresh | Why |
|-----------|-----------------|-----|
| **Weekly** | Ad copy variations | Prevent ad fatigue |
| **Bi-weekly** | New images/videos | Keep content fresh |
| **Monthly** | New concepts/themes | Seasonal, trends, new features |
| **Quarterly** | Full creative overhaul | Major product updates |

**Ad Fatigue Indicators:**
- CTR drops >20%
- CPA increases >20%
- Frequency >3.0 (users seeing ad 3+ times)

---

## Part 6: Advanced Optimization Tactics

### 6.1 Lookalike Audience Expansion

Once 1% lookalikes are profitable, expand:

1. **Create 3% and 5% lookalikes** from same seed audience
2. **Test performance:** 1% vs. 3% vs. 5%
3. **Scale winners:** Often 3% provides best volume/efficiency balance

### 6.2 Advantage+ Shopping Campaigns

Meta's AI-powered campaign type that automates audience targeting:

**When to Use:**
- Proven product-market fit
- Stable conversion rate
- Budget >$50/day
- Want hands-off optimization

**Setup:**
```
Campaign Type: Advantage+ Shopping
Objective: Sales
Optimization: Highest Value
Budget: $100/day
Creative: Dynamic Creative (5 images, 5 headlines)
Audience: Broad (Meta finds best audience)
```

### 6.3 Retargeting with Exclusions

Prevent budget waste by excluding converters:

```
Campaign: Retarget Warm Leads
Audience: Warm Leads (viewed pricing)
Exclude: Active Subscribers ✅
Exclude: Letter Senders (last 30 days) ✅
```

### 6.4 Sequential Retargeting

Show different ads based on funnel stage:

1. **First Touch:** Awareness ad (value prop)
2. **Second Touch (7 days later):** Consideration ad (how it works)
3. **Third Touch (14 days later):** Conversion ad (urgency/discount)

---

## Part 7: Measuring Success

### 7.1 Key Performance Indicators

| Metric | Formula | Target | Frequency |
|--------|---------|--------|-----------|
| **ROAS** | Revenue / Ad Spend | >3.0x | Daily |
| **CPA** | Ad Spend / Conversions | <$15 | Daily |
| **CVR** | Conversions / Clicks | >3% | Weekly |
| **CTR** | Clicks / Impressions | >1.5% | Weekly |
| **Frequency** | Impressions / Reach | 1.5-2.5 | Weekly |
| **LTV:CAC** | Customer LTV / CPA | >3.0 | Monthly |

### 7.2 Dashboard Setup

**Recommended Tools:**

1. **Meta Ads Manager:** Campaign performance
2. **Meta Attribution:** Multi-touch attribution
3. **PostHog:** Product analytics + funnel analysis
4. **Google Sheets:** Custom reporting dashboard

**Custom Columns in Ads Manager:**

```
- ROAS (Purchase)
- Cost Per Purchase
- Purchase Conversion Value
- Frequency
- CTR (Link Click)
- CPC (Cost Per Link Click)
```

### 7.3 Weekly Reporting Template

```markdown
# SteadyLetters - Weekly Ads Report

**Week of:** [Date]
**Total Spend:** $XXX
**Total Revenue:** $XXX
**ROAS:** X.Xx

## Campaign Performance

| Campaign | Spend | Conv | CPA | ROAS |
|----------|-------|------|-----|------|
| ACQ - Lookalike | $XXX | XX | $XX | X.Xx |
| RET - Warm Leads | $XXX | XX | $XX | X.Xx |
| CONV - Abandoners | $XXX | XX | $XX | X.Xx |

## Key Insights

- ✅ What's working
- ⚠️ What needs attention
- 🔄 Changes made this week
- 📋 Next week's plan
```

---

## Part 8: Troubleshooting

### 8.1 Common Issues & Solutions

| Problem | Likely Cause | Solution |
|---------|--------------|----------|
| **Low ROAS (<2.0)** | Poor targeting, weak creative | Test new audiences, refresh creative |
| **High CPA (>$20)** | Audience too broad, low intent | Narrow audience, add exclusions |
| **Low Conversion Rate** | Landing page issues, offer mismatch | Optimize landing page, test offers |
| **Ad Fatigue (Frequency >3.0)** | Same ads shown too often | Refresh creative, expand audience |
| **Learning Phase Stuck** | Too many edits | Stop editing for 7 days |

### 8.2 When to Pause a Campaign

Pause if any of these conditions are met:

- ROAS <1.5x for 7+ days
- CPA >2x your target for 7+ days
- Conversion rate drops >50%
- Frequency >4.0 (severe ad fatigue)
- Better campaign exists (reallocate budget)

---

## Part 9: Optimization Checklist

### 9.1 Daily Tasks (5 minutes)

- [ ] Check spend vs. budget
- [ ] Review ROAS for each campaign
- [ ] Pause any campaigns with ROAS <1.5x
- [ ] Check for delivery issues (low delivery, learning phase)

### 9.2 Weekly Tasks (30 minutes)

- [ ] Analyze top-performing ad creative
- [ ] Refresh creative if frequency >2.5
- [ ] Review audience performance
- [ ] Test 1-2 new ad variations
- [ ] Export data to reporting dashboard

### 9.3 Monthly Tasks (2 hours)

- [ ] Full campaign performance review
- [ ] Calculate LTV:CAC ratio
- [ ] Run A/B test on new variable
- [ ] Expand or contract budgets based on ROAS
- [ ] Plan next month's creative themes

---

## Part 10: Next Steps

### After META-008 ✅

1. **Month 1-2:** Run campaigns, collect 100+ conversions
2. **Month 3:** Launch first Conversion Lift Study
3. **Month 4:** Expand to Advantage+ campaigns
4. **Month 6:** Evaluate full-funnel attribution

### Advanced Topics

- **Incrementality Testing** - Measure true ad impact
- **Multi-Touch Attribution** - Credit all touchpoints
- **Predictive Audiences** - Use LTV to build better lookalikes
- **Cross-Channel Optimization** - Coordinate Meta + Google + Email

---

## Resources

### Meta Documentation

- [Value Optimization](https://www.facebook.com/business/help/1779148548936179)
- [Conversion Lift Studies](https://www.facebook.com/business/measurement/conversion-lift)
- [Dynamic Creative](https://www.facebook.com/business/help/397103717129942)
- [A/B Testing](https://www.facebook.com/business/help/1738164643098669)

### Internal Documentation

- Meta Pixel Integration: `docs/META_PIXEL_INTEGRATION.md`
- Custom Audiences: `docs/META_CUSTOM_AUDIENCES.md`
- Tracking SDK: `src/lib/tracking.ts`
- Meta CAPI: `src/lib/meta-capi.ts`

### Tools

- [Meta Ads Manager](https://business.facebook.com/adsmanager)
- [Meta Events Manager](https://business.facebook.com/events_manager2)
- [Meta Experiments](https://www.facebook.com/business/measurement/experiments)
- [Meta Pixel Helper](https://chrome.google.com/webstore/detail/meta-pixel-helper/)

---

## Support

For questions or issues:

- **Meta Support:** [Business Help Center](https://www.facebook.com/business/help)
- **Internal:** Check conversion tracking in PostHog
- **Tracking Issues:** See `docs/META_PIXEL_INTEGRATION.md`

---

**Last Updated:** January 26, 2026
**Maintained By:** Growth Team
**Next Review:** February 26, 2026
