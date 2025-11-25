# DATABASE_URL Setup for Vercel

## ✅ Status
10 out of 11 environment variables have been set in Vercel.

## ⚠️ Missing: DATABASE_URL

You need to add the production Supabase DATABASE_URL to Vercel.

### How to Get It:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/jibnaxhixzbuizscucbs
2. Click the **"Connect"** button at the top
3. Select **"Transaction mode"** (recommended for Vercel/serverless)
4. Copy the connection string - it will look like:
   ```
   postgres://postgres.jibnaxhixzbuizscucbs:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```

### Set It in Vercel:

**Option A: Via CLI (Recommended)**
```bash
cd /Users/isaiahdupree/Documents/Software/KindLetters
vercel env add DATABASE_URL production
# Then paste the connection string when prompted
```

**Option B: Via Dashboard**
1. Go to: https://vercel.com/isaiahduprees-projects/steadyletters/settings/environment-variables
2. Click "Add New"
3. Name: `DATABASE_URL`
4. Value: (paste your connection string)
5. Environment: Select **Production**, **Preview**, and **Development**
6. Click "Save"

### Important Notes:

- Use **Transaction mode** (port 6543) for Vercel/serverless deployments
- The connection string format: `postgres://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`
- Replace `[YOUR-PASSWORD]` with your actual database password
- If you don't know your password, reset it in Supabase Dashboard → Settings → Database

### After Setting DATABASE_URL:

Once DATABASE_URL is set, you can trigger a deployment:
- Push a commit to GitHub (auto-deploys)
- Or manually redeploy from Vercel dashboard

