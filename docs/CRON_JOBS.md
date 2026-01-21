# SteadyLetters Cron Jobs

This document describes the scheduled cron jobs configured for SteadyLetters.

## Monthly Usage Reset

**Endpoint:** `/api/cron/reset-usage`
**Schedule:** `0 0 1 * *` (Midnight UTC on the 1st of every month)
**Purpose:** Reset all user usage counters for the new billing cycle

### What It Does

This cron job resets the following usage counters for ALL users:

- `letterGenerations` → 0
- `imageGenerations` → 0
- `lettersSent` → 0
- `voiceTranscriptions` → 0
- `imageAnalyses` → 0
- `postcardsSent` → 0
- `lettersSentStandard` → 0
- `greetingCardsSent` → 0
- `windowlessLettersSent` → 0
- `giftCardsSent` → 0

It also updates the `resetAt` date to the 1st of the next month.

### Authentication

The endpoint is protected by a secret token to prevent unauthorized access.

**Environment Variable:** `CRON_SECRET`

When calling the endpoint, include the secret in the Authorization header:

```bash
Authorization: Bearer <CRON_SECRET>
```

If `CRON_SECRET` is not configured, the endpoint will allow unauthenticated requests (useful for development/testing).

### Manual Testing

To manually trigger the usage reset:

```bash
# Without authentication (if CRON_SECRET is not set)
curl http://localhost:3000/api/cron/reset-usage

# With authentication
curl -H "Authorization: Bearer your-secret-here" \
  http://localhost:3000/api/cron/reset-usage
```

### Response Format

**Success (200):**

```json
{
  "success": true,
  "usersReset": 42,
  "resetAt": "2026-01-20T12:34:56.789Z",
  "nextResetDate": "2026-02-01T00:00:00.000Z"
}
```

**Unauthorized (401):**

```json
{
  "error": "Unauthorized"
}
```

**Server Error (500):**

```json
{
  "error": "Internal server error",
  "details": "Error message here"
}
```

### Vercel Configuration

The cron job is configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/reset-usage",
      "schedule": "0 0 1 * *"
    }
  ]
}
```

**Cron Expression:** `0 0 1 * *`

- Minute: `0` (at minute 0)
- Hour: `0` (at midnight UTC)
- Day of Month: `1` (on the 1st)
- Month: `*` (every month)
- Day of Week: `*` (any day)

### Production Deployment

1. Set the `CRON_SECRET` environment variable in Vercel:
   ```bash
   vercel env add CRON_SECRET
   ```

2. Deploy the application:
   ```bash
   vercel --prod
   ```

3. Verify the cron job is registered:
   - Go to Vercel Dashboard → Your Project → Settings → Cron Jobs
   - You should see: `/api/cron/reset-usage` scheduled for `0 0 1 * *`

### Monitoring

Check the Vercel logs to monitor cron execution:

```bash
vercel logs --follow
```

Look for log entries like:

```
[CRON] Usage reset completed for 42 users at 2026-02-01T00:00:00.123Z
```

### Idempotency

The cron job is idempotent - it can be safely called multiple times. Each execution resets all usage counters to 0 regardless of their current value.

### Limitations

**Vercel Free Tier:** Limited to 2 cron jobs
**Vercel Pro Tier:** Up to 10 cron jobs
**Vercel Enterprise:** Unlimited cron jobs

### Future Enhancements

Potential improvements to consider:

1. **Email Notifications:** Send summary email after reset
2. **Selective Reset:** Only reset users with active subscriptions
3. **Backup:** Create usage snapshot before reset
4. **Analytics:** Track reset history and trends
5. **Dry Run Mode:** Preview reset without executing

### Troubleshooting

**Cron not executing:**

1. Check Vercel Dashboard → Cron Jobs to verify it's registered
2. Verify `CRON_SECRET` is set in production environment
3. Check Vercel logs for error messages
4. Manually trigger to test: `curl -H "Authorization: Bearer $CRON_SECRET" https://steadyletters.com/api/cron/reset-usage`

**Authentication failures:**

1. Ensure `CRON_SECRET` matches between Vercel Cron configuration and environment variable
2. Check for extra whitespace in the secret value
3. Verify the secret is set in the correct environment (Production, Preview, Development)

**Database errors:**

1. Check Prisma connection string
2. Verify database is accessible from Vercel
3. Check for schema changes that might have broken the update query
