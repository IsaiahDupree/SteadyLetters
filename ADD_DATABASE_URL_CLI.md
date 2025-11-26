# Add DATABASE_URL via Vercel CLI

## Quick Command

```bash
cd /Users/isaiahdupree/Documents/Software/KindLetters/kindletters-backend

# Add DATABASE_URL for all environments
vercel env add DATABASE_URL production,preview,development
```

When prompted, paste your production Supabase connection string.

---

## Get Your Connection String

### Option 1: From Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/jibnaxhixzbuizscucbs/settings/database
2. Scroll to **Connection string** section
3. Select **Transaction mode** (port 6543)
4. Copy the connection string
5. Replace `[YOUR-PASSWORD]` with your actual password

### Option 2: Construct It Manually

Format:
```
postgres://postgres.jibnaxhixzbuizscucbs:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

Replace `[PASSWORD]` with your Supabase database password.

---

## Full CLI Workflow

```bash
# 1. Navigate to backend directory
cd /Users/isaiahdupree/Documents/Software/KindLetters/kindletters-backend

# 2. Make sure you're linked to the right project
vercel link --project=steadylettersbackend

# 3. Add DATABASE_URL
vercel env add DATABASE_URL production,preview,development
# Paste: postgres://postgres.jibnaxhixzbuizscucbs:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# 4. Verify it was added
vercel env ls

# 5. Redeploy (or wait for auto-deploy)
vercel --prod
```

---

## Verify Environment Variables

```bash
vercel env ls
```

Should show `DATABASE_URL` in the list.

---

## Alternative: Add All Variables at Once

If you want to add multiple variables:

```bash
# Add each variable
vercel env add DATABASE_URL production,preview,development
vercel env add NEXT_PUBLIC_SUPABASE_URL production,preview,development
vercel env add OPENAI_API_KEY production,preview,development
# ... etc
```

---

**Note**: The connection string must use your actual Supabase database password. If you don't know it, reset it in the Supabase Dashboard.

