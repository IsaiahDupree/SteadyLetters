# 🔍 Vercel Settings Audit - Backend Project

## Current Settings Analysis

### ❌ Issues Found

1. **Framework Preset: Next.js** ❌
   - **Current**: Next.js
   - **Should be**: Other
   - **Why**: This is an Express.js backend, not a Next.js app

2. **Development Command: `next`** ❌
   - **Current**: `next`
   - **Should be**: `npm run dev` or leave disabled
   - **Why**: Backend uses `tsx watch src/index.ts`, not Next.js

### ✅ Correct Settings

1. **Root Directory: `kindletters-backend`** ✅
   - Correct!

2. **Build Command: `npm install && npm run build`** ✅
   - Correct! This will run TypeScript compilation

3. **Output Directory: `dist`** ✅
   - Correct! TypeScript outputs to `dist/`

4. **Install Command: `npm install`** ✅
   - Correct!

5. **Include files outside root: Enabled** ✅
   - This is fine, allows access to shared files if needed

6. **Skip deployments: Disabled** ✅
   - This is fine

---

## Required Changes

### Step 1: Change Framework Preset

1. In Vercel Dashboard → Backend Project → Settings → General
2. Find **"Framework Preset"** dropdown
3. Change from **"Next.js"** to **"Other"**
4. This will reset some settings - that's okay

### Step 2: Update Development Command (Optional)

1. Find **"Development Command"**
2. Either:
   - **Option A**: Disable the override (toggle off)
   - **Option B**: Set to `npm run dev` (if you want to test locally via Vercel)

### Step 3: Verify Build Settings

After changing Framework Preset to "Other", verify:
- ✅ Build Command: `npm install && npm run build`
- ✅ Output Directory: `dist`
- ✅ Install Command: `npm install`

### Step 4: Save

Click **"Save"** button at the bottom

---

## Correct Configuration

### Framework Settings
```
Framework Preset: Other
Build Command: npm install && npm run build
Output Directory: dist
Install Command: npm install
Development Command: (disabled or npm run dev)
```

### Root Directory
```
Root Directory: kindletters-backend
Include files outside root: Enabled (optional)
Skip deployments: Disabled (optional)
```

---

## Why These Changes Matter

### Framework Preset: Other
- Prevents Vercel from trying to use Next.js build tools
- Ensures Express.js app is treated as a serverless function
- Allows custom build configuration

### Development Command
- `next` command doesn't exist in backend
- Backend uses `npm run dev` which runs `tsx watch src/index.ts`
- Not critical for production, but good to fix

---

## After Making Changes

1. ✅ Save settings
2. ✅ Redeploy (or wait for next push)
3. ✅ Build should now work correctly
4. ✅ No more Next.js detection errors

---

## Verification Checklist

After updating settings, verify:
- [ ] Framework Preset = "Other"
- [ ] Build Command = `npm install && npm run build`
- [ ] Output Directory = `dist`
- [ ] Root Directory = `kindletters-backend`
- [ ] Settings saved successfully
- [ ] Next deployment uses correct settings

---

**Status**: ⚠️ **Needs Fix - Framework Preset should be "Other"**

