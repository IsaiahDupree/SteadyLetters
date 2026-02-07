# SteadyLetters Live API Tests

**⚠️ WARNING: These tests send real mail and spend real money via Thanks.io API**

## Overview

This directory contains live integration tests that make actual API calls to Thanks.io and send physical mail. Unlike unit tests, these tests validate the entire fulfillment pipeline end-to-end.

## Safety Gates

Multiple safety mechanisms prevent accidental execution:

### 1. Environment Variable Opt-In
Tests only run when BOTH variables are set:
```bash
THANKS_IO_LIVE_TEST=true        # Required to enable
THANKS_IO_API_KEY=<real_key>    # Required to authenticate
```

### 2. Max Spend Cap
```bash
THANKS_IO_LIVE_TEST_MAX_SPEND=5.00  # Default $5.00 per run
```
Tests abort if cumulative cost would exceed this limit.

### 3. CI Protection
- Tests use `describe.skip` when environment variables are not set
- Running `npm test` or `vitest` does NOT execute live tests
- Only `npm run test:live` scripts invoke them

### 4. Default Test Recipient
All mail is sent to this address (configurable via env vars):
```
SteadyLetters QA
3425 Delaney Drive Apt 214
Melbourne, FL 32934
USA
```

## Test Profiles

### Smoke ($1.14)
**Fastest, cheapest validation**
```bash
npm run test:live:smoke
```
- 1 postcard (4x6) sent
- All connectivity tests ($0)
- All error handling tests ($0)
- All pricing verification tests ($0)
- **Total: ~$1.14**

### Standard ($5.78)
**Comprehensive product testing**
```bash
npm run test:live:standard
```
- All postcard sizes (4x6, 6x9, 6x11)
- 1 windowed letter
- All connectivity, error, and pricing tests
- **Total: ~$5.78**

### Full ($12.00)
**Complete test coverage**
```bash
npm run test:live:full
```
- All postcard sizes + custom image
- Windowed + multi-page letters
- Greeting card
- Windowless letter with PDF
- All connectivity, error, and pricing tests
- **Total: ~$12.00**

## Running Tests

### Prerequisites
1. Get a Thanks.io API key from https://thanks.io
2. Set environment variables in `.env.local`:
   ```bash
   THANKS_IO_LIVE_TEST=true
   THANKS_IO_API_KEY=your_real_api_key_here
   THANKS_IO_LIVE_TEST_MAX_SPEND=5.00  # Optional, default $5.00
   ```

### Execute Tests
```bash
# Default profile (smoke)
npm run test:live

# Specific profiles
npm run test:live:smoke     # $1.14
npm run test:live:standard  # $5.78
npm run test:live:full      # $12.00
```

### Override Default Recipient
Use environment variables to send to a different address:
```bash
LIVE_TEST_RECIPIENT_NAME="John Doe" \
LIVE_TEST_RECIPIENT_ADDRESS="123 Main St" \
LIVE_TEST_RECIPIENT_CITY="Portland" \
LIVE_TEST_RECIPIENT_STATE="OR" \
LIVE_TEST_RECIPIENT_ZIP="97201" \
LIVE_TEST_RECIPIENT_COUNTRY="US" \
npm run test:live:smoke
```

## Test Categories

### 1. API Connectivity ($0)
- LIVE-001: Authenticate with Thanks.io API
- LIVE-002: Fetch handwriting styles
- LIVE-003: Verify account status

### 2. Postcard Send ($1.14–$3.58)
- LIVE-004: Send 4x6 postcard (smoke)
- LIVE-005: Send 6x9 postcard (standard+)
- LIVE-006: Send 6x11 postcard (standard+)
- LIVE-007: Send postcard with custom image (full only)

### 3. Letter Send ($1.20–$2.60)
- LIVE-009: Send windowed letter (standard+)
- LIVE-010: Send 2-page letter (full only)

### 4. Greeting Card Send ($3.00)
- LIVE-012: Send greeting card (full only)

### 5. Windowless Letter Send ($2.52)
- LIVE-014: Send windowless letter with PDF (full only)

### 6. Error Handling ($0)
- LIVE-016: Invalid API key
- LIVE-017: Missing required fields
- LIVE-018: Invalid address format
- LIVE-019: Invalid postal code

### 7. Order Status ($0)
- LIVE-020: Check order status by ID (standard+)

### 8. Pricing Verification ($0)
- LIVE-022: Verify postcard 4x6 = $1.14
- LIVE-023: Verify postcard 6x9 = $1.61
- LIVE-024: Verify postcard 6x11 = $1.83
- LIVE-025: Verify letter = $1.20
- LIVE-026: Verify greeting = $3.00
- LIVE-027: Verify windowless = $2.52

## Test Reports

After each run, a JSON report is saved to `tests/live/reports/`:

```json
{
  "runId": "live-2026-02-06T23-22-08-123Z",
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
      "orderId": "tio_abc123xyz",
      "type": "postcard-4x6",
      "cost": 1.14,
      "recipient": "3425 Delaney Drive Apt 214, Melbourne FL 32934",
      "timestamp": "2026-02-06T23:22:10.456Z"
    }
  ],
  "timestamp": "2026-02-06T23:22:15.789Z"
}
```

Reports directory is in `.gitignore` to prevent accidental commit of order IDs.

## Cost Tracker

The `CostTracker` class enforces budget limits:
- Checks available budget before each send
- Aborts with descriptive error if spend would exceed max
- Records all orders with test ID, order ID, type, cost, recipient
- Prints summary at end of run
- Saves detailed JSON report

## Architecture

### Files
- `config.ts` - Configuration and safety gates
- `cost-tracker.ts` - Budget enforcement and reporting
- `thanks-io-live.test.ts` - 27 live tests across 8 categories
- `reports/` - JSON reports (auto-created, gitignored)

### Flow
1. Tests check `ENABLED` flag (requires both env vars)
2. `assertLiveTestEnabled()` throws if disabled
3. Profile determines which tests run via `it.skipIf(!isStandard)`
4. Before each send: `tracker.assertCanSpend(cost, description)`
5. After each send: `tracker.recordSpend(testId, orderId, ...)`
6. After all tests: `tracker.printSummary()` and `tracker.saveReport()`

## Troubleshooting

### Tests Skip Immediately
✅ Expected behavior when env vars are not set. This is a safety feature.

Set both variables to enable:
```bash
THANKS_IO_LIVE_TEST=true THANKS_IO_API_KEY=your_key npm run test:live
```

### Budget Exceeded Error
The tracker prevents overspending. To run more tests:
```bash
THANKS_IO_LIVE_TEST_MAX_SPEND=15.00 npm run test:live:full
```

### API Authentication Failed (401)
- Verify your API key is correct
- Check that the key has not expired
- Ensure the key has permissions to send mail

### Order Created But Test Failed
Check the JSON report in `tests/live/reports/` for order IDs. You can verify order status via:
```bash
curl -H "Authorization: Bearer $THANKS_IO_API_KEY" \
  https://api.thanks.io/api/v2/order/{orderId}
```

## Best Practices

1. **Run smoke tests weekly** to catch API changes early (~$1.14/week = $4.56/month)
2. **Run standard tests monthly** before major releases (~$5.78/month)
3. **Run full tests quarterly** or before major API integration changes (~$12.00/quarter = $4.00/month)
4. **Never commit API keys** - always use `.env.local`
5. **Verify physical mail arrival** - first time, check that mail actually arrives at the default address
6. **Monitor cost reports** - review JSON reports to track spending trends

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `THANKS_IO_LIVE_TEST` | Yes | `false` | Must be `true` to enable |
| `THANKS_IO_API_KEY` | Yes | — | Real Thanks.io API key |
| `THANKS_IO_LIVE_TEST_MAX_SPEND` | No | `5.00` | Max spend per run ($) |
| `LIVE_TEST_PROFILE` | No | `smoke` | Test profile: smoke/standard/full |
| `LIVE_TEST_RECIPIENT_NAME` | No | `SteadyLetters QA` | Recipient name |
| `LIVE_TEST_RECIPIENT_ADDRESS` | No | `3425 Delaney Drive Apt 214` | Street address |
| `LIVE_TEST_RECIPIENT_CITY` | No | `Melbourne` | City |
| `LIVE_TEST_RECIPIENT_STATE` | No | `FL` | State/province |
| `LIVE_TEST_RECIPIENT_ZIP` | No | `32934` | Postal code |
| `LIVE_TEST_RECIPIENT_COUNTRY` | No | `US` | Country code |

## Cost Budget (Recommended)

| Frequency | Profile | Cost/Run | Annual Cost |
|-----------|---------|----------|-------------|
| Weekly smoke | smoke | $1.14 | $59.28 |
| Monthly standard | standard | $5.78 | $69.36 |
| Quarterly full | full | $12.00 | $48.00 |
| **Total** | | | **~$176.64/year** |

Adjust frequency based on development velocity and risk tolerance.

## Support

For issues or questions:
- Check this README
- Review test output and JSON reports
- Verify environment variables are set correctly
- Ensure Thanks.io API key is valid and has permissions

---

**Remember: These tests spend real money. Always verify your budget and recipient address before running.**
