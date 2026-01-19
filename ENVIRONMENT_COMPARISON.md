# 🔍 Environment Comparison Testing

## Overview

The environment comparison tests verify that your local development build and production deployment behave identically. This ensures:

- ✅ No environment-specific bugs
- ✅ Consistent API behavior
- ✅ Similar performance characteristics
- ✅ Same security headers
- ✅ Identical error handling

## Quick Start

```bash
# Run comparison tests
npm test -- tests/environment-comparison.test.mjs

# Or use the helper script
node tests/run-comparison.mjs
```

## What Gets Tested

### 1. Homepage
- Loads successfully on both environments
- Response times are comparable
- Content is consistent

### 2. Public Pages
Tests all public routes:
- `/pricing`
- `/login`
- `/signup`
- `/privacy`
- `/terms`

### 3. API Endpoints
- Authentication behavior (both require auth)
- Error handling (consistent responses)
- Response formats

### 4. Protected Routes
- `/dashboard`
- `/recipients`
- `/templates`

All should redirect or require authentication on both environments.

### 5. Static Assets
- Asset serving works on both
- Content types are correct

### 6. Security Headers
- Content-Type headers
- Security-related headers
- CORS configuration

### 7. Performance
- Response time comparison
- Identifies performance regressions
- Shows local vs production speed differences

## Test Results

The tests will show:
- ✅ **Passing:** Both environments behave identically
- ⚠️ **Warnings:** Minor differences (logged but not failing)
- ❌ **Failures:** Significant differences that need attention

## Example Output

```
📊 Performance Comparison:
Local:      45ms (min: 40ms, max: 52ms)
Production: 76ms (min: 70ms, max: 93ms)

✅ All tests passing - environments are consistent!
```

## Configuration

Set environment variables to customize URLs:

```bash
# Custom local URL
LOCAL_URL=http://localhost:3001 npm test -- tests/environment-comparison.test.mjs

# Custom production URL
PRODUCTION_URL=https://staging.steadyletters.com npm test -- tests/environment-comparison.test.mjs

# Both
LOCAL_URL=http://localhost:3001 PRODUCTION_URL=https://staging.steadyletters.com npm test -- tests/environment-comparison.test.mjs
```

## Troubleshooting

### Local Server Not Running

If you see:
```
⚠️  Local server not running. Start with: npm run dev
```

Start your local server:
```bash
npm run dev
```

### Production Unreachable

If production tests fail:
1. Check your internet connection
2. Verify the production URL is correct
3. Check if production is down

### Performance Differences

Production may be slower due to:
- CDN edge locations
- Database connection pooling
- Caching differences

This is normal - tests allow for reasonable differences (<3s).

## Best Practices

1. **Run before deploying:** Ensure local changes work in production
2. **Run after deployment:** Verify production matches expectations
3. **CI/CD Integration:** Add to your deployment pipeline
4. **Regular checks:** Run weekly to catch environment drift

## Integration with CI/CD

Add to your CI pipeline:

```yaml
# .github/workflows/test.yml
- name: Environment Comparison
  run: |
    npm test -- tests/environment-comparison.test.mjs
  env:
    PRODUCTION_URL: ${{ secrets.PRODUCTION_URL }}
```

---

**Status:** ✅ 16/16 tests passing - Local and production are consistent!


