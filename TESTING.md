# 🧪 Testing Guide - SteadyLetters

Comprehensive testing strategy for local development and production deployment.

## Test Coverage

### Current Status
- **Total Tests:** 405/407 Passing (2 skipped - expected)
- **Test Suites:** 23/23 Passing
- **Pass Rate:** 99.5% (100% excluding expected skips) ✅

### Test Categories

#### 1. **Unit Tests** (`tests/unit.test.mjs`)
- **Tests:** 10 (2 skipped - require Next.js runtime)
- **Coverage:** Core utilities, pricing tiers, test fixtures
- **Run:** `npm test -- tests/unit.test.mjs`

#### 2. **Backend E2E Tests** (`tests/backend-e2e.test.mjs`)
- **Tests:** 41 tests
- **Coverage:** Unauthenticated API endpoints (401s are expected ✅)
- **Run:** `npm test -- tests/backend-e2e.test.mjs`

#### 3. **API Endpoint Tests** (`tests/api-endpoints.test.mjs`)
- **Tests:** 20 tests
- **Coverage:** All public API endpoints
- **Run:** `npm test -- tests/api-endpoints.test.mjs`

#### 4. **Production Tests** (`tests/production.test.mjs`)
- **Tests:** 12 tests
- **Coverage:** Live production site verification
- **Run:** `npm test -- tests/production.test.mjs`

#### 5. **Playwright E2E Tests** (`tests/e2e/*.spec.ts`)
- **Coverage:** Authenticated flows, user interactions
- **Run:** `npm run test:e2e`

---

## Running Tests

### Quick Reference

```bash
# Run all Jest tests
npm test

# Run all Playwright E2E tests (local)
npm run test:e2e:local

# Run all tests (Jest + Playwright)
npm run test:all

# Run tests against production
npm run test:e2e:production

# Compare local vs production
npm run test:compare
npm run test:e2e:both
```

---

## Environment Testing

### Testing Against Local Build

```bash
# Start dev server
npm run dev

# In another terminal:
npm test                    # Jest tests
npm run test:e2e:local     # Playwright tests
```

### Testing Against Production

```bash
# Jest tests against production
PRODUCTION_URL=https://www.steadyletters.com npm test -- tests/production.test.mjs
npm run test:production

# Playwright tests against production
npm run test:e2e:production

# Or set environment directly
TEST_ENV=production npx playwright test
```

### Comparing Both Environments

The environment comparison test automatically tests both local and production:

```bash
npm run test:compare
```

This runs:
- Performance comparison
- Feature parity checks
- Response time analysis
- Status code verification

---

## Test Scripts Reference

### Jest Tests
| Script | Description |
|--------|-------------|
| `npm test` | Run all Jest tests |
| `npm test -- <file>` | Run specific test file |
| `npm run test:local` | Test against local environment |
| `npm run test:production` | Test against production |
| `npm run test:compare` | Compare both environments |

### Playwright Tests
| Script | Description |
|--------|-------------|
| `npm run test:e2e` | Run all E2E tests (default: local) |
| `npm run test:e2e:local` | Run E2E tests against local |
| `npm run test:e2e:production` | Run E2E tests against production |
| `npm run test:e2e:both` | Run E2E against both environments |
| `npm run test:all` | Run Jest + Playwright (local) |

---

## Authenticated Testing

**Note:** Authenticated API tests have been migrated to Playwright for proper cookie-based authentication.

### Why Playwright for Auth Tests?

Node.js `fetch()` doesn't handle Supabase cookie-based authentication properly. Playwright uses real browsers with proper cookie handling.

### Running Authenticated Tests

```bash
# Run authenticated API tests
npx playwright test tests/e2e/backend-api-authenticated.spec.ts

# Run all authenticated tests
npx playwright test tests/e2e/authenticated.spec.ts
```

### Migrated Test Files

These Jest test files now redirect to Playwright implementations:
- `tests/backend-e2e-auth.test.mjs` → `tests/e2e/backend-api-authenticated.spec.ts`
- `tests/performance-auth.test.mjs` → `tests/e2e/authenticated.spec.ts`
- `tests/security-auth.test.mjs` → `tests/e2e/authenticated.spec.ts`

---

## Test Configuration

### Playwright Configuration

**Local Testing** (default):
```typescript
baseURL: 'http://localhost:3000'
webServer: { command: 'npm run dev' }
```

**Production Testing**:
```typescript
baseURL: 'https://www.steadyletters.com'
webServer: undefined  // No local server needed
```

### Environment Variables

```bash
# Jest Tests
LOCAL_URL=http://localhost:3000
PRODUCTION_URL=https://www.steadyletters.com
NEXT_PUBLIC_URL=http://localhost:3000

# Playwright Tests
TEST_ENV=production  # Default: local
```

---

## Expected Test Behavior

### ✅ Expected Failures (Not Really Failures)

1. **Backend E2E Tests (41 tests)**
   - Many tests return 401 (Unauthorized)
   - This is EXPECTED and CORRECT ✅
   - Tests verify that authentication is required

2. **Unit Tests (2 skipped)**
   - API Auth Helper tests
   - Require Next.js runtime environment
   - Properly skipped, not failures

### ❌ Actual Failures (Should Be Fixed)

If you see failures other than the above, investigate:
1. Check if services are running (dev server, database)
2. Verify environment variables are set
3. Check API rate limits
4. Review error messages in test output

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test-jest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm test

  test-playwright-local:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npx playwright install --with-deps
      - run: npm run test:e2e:local

  test-playwright-production:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npx playwright install --with-deps
      - run: npm run test:e2e:production
```

---

## Writing New Tests

### Jest Test Example

```javascript
import { describe, it, expect } from '@jest/globals';

describe('My Feature', () => {
    it('should do something', async () => {
        const result = await myFunction();
        expect(result).toBeTruthy();
    });
});
```

### Playwright Test Example

```typescript
import { test, expect } from '@playwright/test';

test('user can do something', async ({ page }) => {
    await page.goto('/my-page');
    await page.click('button[data-testid="my-button"]');
    await expect(page.locator('.result')).toBeVisible();
});
```

### Authenticated Playwright Test

```typescript
import { test as base, expect } from '@playwright/test';

const test = base.extend({
    authenticatedPage: async ({ page }, use) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', TEST_EMAIL);
        await page.fill('input[type="password"]', TEST_PASSWORD);
        await page.click('button[type="submit"]');
        await page.waitForURL('/dashboard');
        await use(page);
    },
});

test('authenticated feature', async ({ authenticatedPage }) => {
    // Your test with authenticated context
});
```

---

## Troubleshooting

### Common Issues

**1. Tests timing out**
```bash
# Increase timeout
npx playwright test --timeout=60000
```

**2. Server not running**
```bash
# Make sure dev server is running for local tests
npm run dev
```

**3. Authentication failures in Playwright**
```bash
# Check test credentials in tests/e2e/authenticated.spec.ts
# Ensure user exists in Supabase
```

**4. Environment variable not set**
```bash
# Load from .env.local
export $(cat .env.local | xargs)
npm test
```

---

## Test Maintenance

### Regular Tasks

- [ ] Run full test suite before deployment
- [ ] Update test credentials if changed
- [ ] Review and update expected behavior
- [ ] Monitor flaky tests
- [ ] Keep test coverage above 80%

### When to Run Which Tests

| Scenario | Tests to Run |
|----------|-------------|
| Before commit | `npm test` |
| Before PR | `npm run test:all` |
| Before deployment | `npm run test:e2e:both` |
| After deployment | `npm run test:e2e:production` |
| Performance check | `npm run test:compare` |

---

**Last Updated:** November 25, 2024
**Status:** ✅ All Systems Operational - No Skipped Tests (except expected)
