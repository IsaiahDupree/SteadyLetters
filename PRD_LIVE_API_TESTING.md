# PRD: SteadyLetters Live API Testing

**Version:** 1.0  
**Date:** February 2026  
**Status:** Ready for Implementation  
**Priority:** P0 — Quality Assurance Critical

---

## Problem Statement

SteadyLetters currently has **zero tests that make real Thanks.io API calls**. Every test falls back to mock responses when `THANKS_IO_API_KEY` is absent. This means:

- We have no confidence that real letter sends actually work end-to-end
- API payload format changes from Thanks.io would go undetected
- Pricing changes would not be caught
- Authentication/token issues would only surface in production
- We cannot verify that letters are actually printed, addressed correctly, and mailed

**This PRD defines a gated live API test suite that sends real mail to a known default address, costing real money, to validate the entire fulfillment pipeline.**

---

## Default Test Recipient

All live tests send to this address unless explicitly overridden:

```
Name:        SteadyLetters QA
Address:     3425 Delaney Drive Apt 214
City:        Melbourne
State:       FL
Postal Code: 32934
Country:     US
```

This address is stored as `DEFAULT_LIVE_TEST_RECIPIENT` and can be overridden via environment variables.

---

## Safety Gates

Live tests **spend real money**. Multiple safety gates prevent accidental execution:

### Gate 1: Environment Variable Opt-In
```bash
THANKS_IO_LIVE_TEST=true        # Required — tests skip without this
THANKS_IO_API_KEY=<real_key>    # Required — tests fail without this
```

### Gate 2: Max Spend Cap
```bash
THANKS_IO_LIVE_TEST_MAX_SPEND=5.00  # Default $5.00 per test run
```
The test runner tracks cumulative cost per run and aborts if it would exceed the cap.

### Gate 3: CI Protection
- Live tests are **excluded from all CI pipelines** by default
- Test files are tagged with `@live` and filtered out in CI config
- A dedicated `npm run test:live` script is the only way to invoke them

### Gate 4: Confirmation Log
Every live test logs:
```
⚠️  LIVE API TEST — This will spend real money
📬 Sending: Postcard (4x6) → 3425 Delaney Drive Apt 214, Melbourne FL 32934
💰 Estimated cost: $1.14
🔑 API Key: ...last4chars
```

---

## Test Suite Specification

### File Location
```
tests/live/thanks-io-live.test.ts
```

### Test Categories

#### 1. API Connectivity (Cost: $0)
| Test ID | Test | Expected Result |
|---------|------|-----------------|
| LIVE-001 | Authenticate with Thanks.io API | 200 OK with valid token |
| LIVE-002 | Fetch handwriting styles (real) | Array of styles with IDs |
| LIVE-003 | Fetch account balance/status | Account info returned |

#### 2. Postcard Send (Cost: ~$1.14–$1.83)
| Test ID | Test | Expected Result |
|---------|------|-----------------|
| LIVE-004 | Send 4x6 postcard to default address | Order ID returned, status = `queued` |
| LIVE-005 | Send 6x9 postcard to default address | Order ID returned, verify price = $1.61 |
| LIVE-006 | Send 6x11 postcard to default address | Order ID returned, verify price = $1.83 |
| LIVE-007 | Send postcard with custom front image | Order ID returned with image_url confirmed |
| LIVE-008 | Send postcard with all handwriting colors | Each color accepted, order created |

#### 3. Letter Send (Cost: ~$1.20)
| Test ID | Test | Expected Result |
|---------|------|-----------------|
| LIVE-009 | Send windowed letter to default address | Order ID returned, status = `queued` |
| LIVE-010 | Send letter with 2 pages | Price includes additional page charge |
| LIVE-011 | Send letter with custom handwriting style | Style ID in order confirmation |

#### 4. Greeting Card Send (Cost: ~$3.00)
| Test ID | Test | Expected Result |
|---------|------|-----------------|
| LIVE-012 | Send greeting card to default address | Order ID returned, status = `queued` |
| LIVE-013 | Send greeting card with envelope style | Envelope style in order confirmation |

#### 5. Windowless Letter Send (Cost: ~$2.52)
| Test ID | Test | Expected Result |
|---------|------|-----------------|
| LIVE-014 | Send windowless letter with PDF to default address | Order ID returned, PDF URL confirmed |
| LIVE-015 | Send windowless letter with custom fields | Custom1-4 values in order |

#### 6. Error Handling (Cost: $0)
| Test ID | Test | Expected Result |
|---------|------|-----------------|
| LIVE-016 | Send with invalid API key | 401 Unauthorized |
| LIVE-017 | Send with missing required fields | 400 Bad Request with error message |
| LIVE-018 | Send with invalid address format | Error response with validation details |
| LIVE-019 | Send with invalid postal code | Specific postal code error |

#### 7. Order Status & Tracking (Cost: $0)
| Test ID | Test | Expected Result |
|---------|------|-----------------|
| LIVE-020 | Check order status by ID (from previous send) | Status returned (queued/processing/sent) |
| LIVE-021 | List recent orders | Array of recent orders with IDs |

#### 8. Pricing Verification (Cost: $0)
| Test ID | Test | Expected Result |
|---------|------|-----------------|
| LIVE-022 | Verify postcard 4x6 price = $1.14 | Price matches PRODUCT_CATALOG |
| LIVE-023 | Verify postcard 6x9 price = $1.61 | Price matches PRODUCT_CATALOG |
| LIVE-024 | Verify postcard 6x11 price = $1.83 | Price matches PRODUCT_CATALOG |
| LIVE-025 | Verify letter base price = $1.20 | Price matches PRODUCT_CATALOG |
| LIVE-026 | Verify greeting card price = $3.00 | Price matches PRODUCT_CATALOG |
| LIVE-027 | Verify windowless letter price = $2.52 | Price matches PRODUCT_CATALOG |

---

## Test Run Profiles

### Smoke Test (Cheapest — $1.14)
```bash
npm run test:live -- --profile=smoke
```
Runs: LIVE-001 to LIVE-003, LIVE-004, LIVE-016 to LIVE-019, LIVE-022 to LIVE-027
- **1 real postcard sent** ($1.14)
- All connectivity, error, and pricing tests ($0)

### Standard Test ($7.86)
```bash
npm run test:live -- --profile=standard
```
Runs: All tests LIVE-001 to LIVE-027
- 1 postcard per size ($1.14 + $1.61 + $1.83)
- 1 letter ($1.20)
- 1 greeting card ($3.00) — **SKIPPED by default** (expensive)
- Error and pricing tests ($0)

### Full Test (~$12.00)
```bash
npm run test:live -- --profile=full
```
Runs: All tests including greeting card and windowless letter
- All product types sent
- All sizes and variations
- Complete error matrix

---

## Implementation Architecture

### Test Runner Configuration

```typescript
// tests/live/config.ts
export const LIVE_TEST_CONFIG = {
  enabled: process.env.THANKS_IO_LIVE_TEST === 'true',
  apiKey: process.env.THANKS_IO_API_KEY,
  maxSpend: parseFloat(process.env.THANKS_IO_LIVE_TEST_MAX_SPEND || '5.00'),
  
  defaultRecipient: {
    name: process.env.LIVE_TEST_RECIPIENT_NAME || 'SteadyLetters QA',
    address: process.env.LIVE_TEST_RECIPIENT_ADDRESS || '3425 Delaney Drive Apt 214',
    city: process.env.LIVE_TEST_RECIPIENT_CITY || 'Melbourne',
    province: process.env.LIVE_TEST_RECIPIENT_STATE || 'FL',
    postal_code: process.env.LIVE_TEST_RECIPIENT_ZIP || '32934',
    country: process.env.LIVE_TEST_RECIPIENT_COUNTRY || 'US',
  },
  
  defaultMessage: 'SteadyLetters QA Test — Sent at ' + new Date().toISOString(),
};
```

### Cost Tracker

```typescript
// tests/live/cost-tracker.ts
class CostTracker {
  private totalSpent = 0;
  private maxSpend: number;
  private orders: { id: string; type: string; cost: number; timestamp: string }[] = [];

  canSpend(amount: number): boolean;
  recordSpend(orderId: string, type: string, amount: number): void;
  getReport(): { totalSpent: number; orders: typeof this.orders };
  assertUnderBudget(): void;  // throws if over maxSpend
}
```

### Test Result Logger

Each test run produces a JSON report:
```json
{
  "runId": "live-2026-02-06T01:30:00Z",
  "profile": "smoke",
  "totalSpent": 1.14,
  "maxSpend": 5.00,
  "tests": {
    "passed": 14,
    "failed": 0,
    "skipped": 13
  },
  "orders": [
    {
      "testId": "LIVE-004",
      "orderId": "tio_abc123",
      "type": "postcard",
      "size": "4x6",
      "cost": 1.14,
      "recipient": "3425 Delaney Drive Apt 214, Melbourne FL 32934",
      "status": "queued"
    }
  ],
  "timestamp": "2026-02-06T01:30:45Z"
}
```

Reports saved to: `tests/live/reports/`

---

## npm Scripts

```json
{
  "test:live": "THANKS_IO_LIVE_TEST=true vitest run tests/live/ --reporter=verbose",
  "test:live:smoke": "THANKS_IO_LIVE_TEST=true vitest run tests/live/ --reporter=verbose -- --profile=smoke",
  "test:live:standard": "THANKS_IO_LIVE_TEST=true vitest run tests/live/ --reporter=verbose -- --profile=standard",
  "test:live:full": "THANKS_IO_LIVE_TEST=true vitest run tests/live/ --reporter=verbose -- --profile=full"
}
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `THANKS_IO_LIVE_TEST` | Yes | `false` | Must be `true` to enable live tests |
| `THANKS_IO_API_KEY` | Yes | — | Real Thanks.io API key |
| `THANKS_IO_LIVE_TEST_MAX_SPEND` | No | `5.00` | Max dollars per test run |
| `LIVE_TEST_RECIPIENT_NAME` | No | `SteadyLetters QA` | Recipient name |
| `LIVE_TEST_RECIPIENT_ADDRESS` | No | `3425 Delaney Drive Apt 214` | Street address |
| `LIVE_TEST_RECIPIENT_CITY` | No | `Melbourne` | City |
| `LIVE_TEST_RECIPIENT_STATE` | No | `FL` | State |
| `LIVE_TEST_RECIPIENT_ZIP` | No | `32934` | Postal code |
| `LIVE_TEST_RECIPIENT_COUNTRY` | No | `US` | Country code |
| `LIVE_TEST_PROFILE` | No | `smoke` | Default test profile |

---

## Feature List Additions

| Feature ID | Description | Category | Priority |
|------------|-------------|----------|----------|
| LIVE-TEST-001 | Live test config with safety gates and env vars | testing | P0 |
| LIVE-TEST-002 | Cost tracker with per-run budget enforcement | testing | P0 |
| LIVE-TEST-003 | API connectivity tests (auth, styles, account) | testing | P0 |
| LIVE-TEST-004 | Postcard send tests (all sizes, colors, images) | testing | P0 |
| LIVE-TEST-005 | Letter send tests (windowed, multi-page) | testing | P1 |
| LIVE-TEST-006 | Greeting card send tests | testing | P1 |
| LIVE-TEST-007 | Windowless letter send tests (PDF, custom fields) | testing | P1 |
| LIVE-TEST-008 | Error handling tests (invalid key, bad address) | testing | P0 |
| LIVE-TEST-009 | Order status and tracking verification | testing | P1 |
| LIVE-TEST-010 | Pricing verification against PRODUCT_CATALOG | testing | P0 |
| LIVE-TEST-011 | Test run profiles (smoke, standard, full) | testing | P0 |
| LIVE-TEST-012 | JSON report generation per test run | testing | P1 |
| LIVE-TEST-013 | npm scripts for live test invocation | testing | P0 |
| LIVE-TEST-014 | CI pipeline exclusion for live tests | testing | P0 |
| LIVE-TEST-015 | Default test recipient configuration | testing | P0 |

---

## Deployment Checklist

- [ ] `THANKS_IO_API_KEY` is set in `.env.local`
- [ ] `THANKS_IO_LIVE_TEST=true` only in local/manual runs
- [ ] CI config excludes `tests/live/` directory
- [ ] `.gitignore` includes `tests/live/reports/`
- [ ] First smoke test run confirms postcard arrives at 3425 Delaney Drive Apt 214
- [ ] Cost tracker verified to abort at spend limit

---

## Cost Budget (Monthly)

| Frequency | Profile | Cost/Run | Monthly |
|-----------|---------|----------|---------|
| Weekly smoke | smoke | $1.14 | $4.56 |
| Monthly standard | standard | $7.86 | $7.86 |
| Quarterly full | full | $12.00 | $4.00 |
| **Total** | | | **~$16.42/mo** |

---

## Success Criteria

1. Smoke test sends a real postcard and receives a valid order ID from Thanks.io
2. All error tests correctly identify and categorize API errors
3. Pricing tests catch any price changes from Thanks.io
4. Cost tracker prevents overspend (verified by hitting the limit intentionally)
5. Physical mail arrives at 3425 Delaney Drive Apt 214 within 5-7 business days
6. Test report JSON is saved and parseable after each run
