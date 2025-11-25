# 🐛 Local Debug Guide - 500 Errors

## Problem

API endpoints returning 500 errors in local development:
- `/api/transcribe` - 500 error
- `/api/analyze-image` - 500 error
- `/api/generate/letter` - 500 error

## Debugging Steps

### 1. Check Debug Endpoint

Visit: `http://localhost:3000/api/debug`

This will show:
- Authentication status
- Database connection
- User existence in Prisma
- Environment variables

### 2. Check Server Logs

Look at your terminal where `npm run dev` is running. You should see detailed error messages now.

### 3. Common Issues

#### Issue: User not in Prisma
**Symptom:** User authenticated but 500 error
**Fix:** The code now auto-creates users, but check:
- Database connection is working
- Prisma migrations are applied

#### Issue: Database Connection
**Symptom:** All API calls fail
**Fix:** 
```bash
# Check DATABASE_URL in .env
# Test connection
npx prisma db pull
```

#### Issue: Missing Environment Variables
**Symptom:** Specific features fail
**Fix:** Check `.env.local` has:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL`
- `OPENAI_API_KEY`

### 4. Test Authentication

1. Open browser console
2. Go to `/login`
3. Sign in
4. Check cookies - should see Supabase auth cookies
5. Try API call again

### 5. Check Error Details

In development mode, errors now include:
- Error message
- Stack trace
- Error type

Check browser console for detailed error information.

## Quick Fixes

### Restart Dev Server
```bash
# Stop server (Ctrl+C)
npm run dev
```

### Reset Database
```bash
npx prisma migrate reset
npx prisma generate
```

### Check Prisma Client
```bash
npx prisma generate
```

## Testing

Run the authenticated API tests:
```bash
npm test -- tests/api-authenticated.test.mjs
```

## What Was Fixed

1. **Better Error Messages:** Development mode now shows detailed errors
2. **User Auto-Creation:** Users are automatically created in Prisma
3. **Error Logging:** Better console logging for debugging
4. **Debug Endpoint:** `/api/debug` for quick diagnostics

## Still Having Issues?

1. Check `/api/debug` endpoint
2. Check server logs in terminal
3. Check browser console for detailed errors
4. Verify all environment variables are set
5. Ensure database is accessible

---

**Status:** ✅ Error handling improved, debug tools added

