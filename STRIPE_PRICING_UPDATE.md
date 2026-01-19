# ✅ Stripe Pricing Updated

**Date:** November 25, 2024

## 📊 New Pricing Structure

Based on comprehensive cost analysis in `tierresearch.txt`, pricing has been updated to ensure sustainable unit economics and CAC recovery by month 2.

### Updated Prices

#### Pro Plan
- **Monthly:** $29.99/month
  - Price ID: `price_1SXDRgBF0wJEbOgNxcjhbxSm`
- **Annual:** $299/year ($24.99/month effective)
  - Price ID: `price_1SXDRgBF0wJEbOgNdR6VMYkj`

#### Business Plan
- **Monthly:** $59.99/month
  - Price ID: `price_1SXDRgBF0wJEbOgNk7heHwTq`
- **Annual:** $599/year ($49.99/month effective)
  - Price ID: `price_1SXDRhBF0wJEbOgNfZCpxmkW`

### Updated Usage Limits

#### Free Tier (unchanged)
- 5 AI letter generations/month
- 10 image generations/month
- 3 letters mailed/month

#### Pro Tier (updated)
- 50 AI letter generations/month
- 100 image generations/month
- **10 letters mailed/month** (was 25)
- Unlimited voice transcriptions
- Unlimited image analyses
- $2/letter after limit

#### Business Tier (updated)
- **200 AI letter generations/month** (was unlimited)
- **400 image generations/month** (was unlimited)
- **50 letters mailed/month** (was 100)
- Unlimited voice transcriptions
- Unlimited image analyses
- Priority support
- Custom branding
- $1.50/letter after limit

## 🔄 Environment Variables Updated

All price IDs have been updated in Vercel:
- ✅ `STRIPE_PRO_PRICE_ID` = `price_1SXDRgBF0wJEbOgNxcjhbxSm`
- ✅ `STRIPE_BUSINESS_PRICE_ID` = `price_1SXDRgBF0wJEbOgNk7heHwTq`
- ✅ `STRIPE_PRO_ANNUAL_PRICE_ID` = `price_1SXDRgBF0wJEbOgNdR6VMYkj`
- ✅ `STRIPE_BUSINESS_ANNUAL_PRICE_ID` = `price_1SXDRhBF0wJEbOgNfZCpxmkW`

## 📝 Rationale

The pricing update is based on:
1. **Cost Analysis:** Physical mailing costs $2-3 per letter (dominant cost driver)
2. **Market Benchmarks:** Comparable SaaS tools charge $20-49/month
3. **CAC Recovery:** $29.99 Pro plan recovers $60 CAC by month 2
4. **Unit Economics:** Ensures profitability even with heavy usage

## 🚀 Next Steps

1. ✅ Stripe products and prices created
2. ✅ Environment variables updated in Vercel
3. ✅ Code updated to match new limits
4. ⏳ Deploy to production
5. ⏳ Test checkout flow with new prices

## 📋 Old vs New Comparison

| Tier | Old Price | New Price | Old Letters | New Letters |
|------|-----------|-----------|-------------|-------------|
| Pro | $9.99 | $29.99 | 25/month | 10/month |
| Business | $29.99 | $59.99 | 100/month | 50/month |

The new pricing better reflects the true cost of the service, especially physical mailing, while remaining competitive in the market.


