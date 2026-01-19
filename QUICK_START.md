# 🚀 SteadyLetters - Quick Start Guide

A simple, step-by-step guide to get the app running and tested. Anyone can follow these steps!

---

## 📋 Prerequisites

Before you begin, make sure you have:

| Tool | How to Check | How to Install |
|------|-------------|----------------|
| **Node.js 18+** | `node --version` | [nodejs.org](https://nodejs.org) |
| **npm** | `npm --version` | Comes with Node.js |
| **Docker** | `docker --version` | [docker.com](https://docker.com) |
| **Git** | `git --version` | [git-scm.com](https://git-scm.com) |

---

## 🏃 Step 1: Start the Database (Supabase)

**What this does:** Starts the local database where your app data lives.

```bash
# Make sure Docker is running first!
# Then start Supabase:
npx supabase start
```

**✅ Success looks like:**
```
Started supabase local development setup.
API URL: http://127.0.0.1:54421
DB URL: postgresql://postgres:postgres@127.0.0.1:54422/postgres
```

**⏱️ Time:** ~30 seconds (first time may take 2-3 minutes to download)

---

## 🏃 Step 2: Install Dependencies

**What this does:** Downloads all the code libraries the app needs.

```bash
npm install
```

**✅ Success looks like:** No errors, ends with `added X packages`

**⏱️ Time:** ~1-2 minutes

---

## 🏃 Step 3: Set Up Environment Variables

**What this does:** Configures API keys and database connections.

```bash
# Copy the example environment file
cp .env.local .env
```

**Key variables in `.env`:**
```env
# Database (should already be set for local Supabase)
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54422/postgres"
NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54421"

# App URL
NEXT_PUBLIC_URL=http://localhost:3000
```

---

## 🏃 Step 4: Start the Development Server

**What this does:** Runs the web app so you can use it in your browser.

```bash
npm run dev
```

**✅ Success looks like:**
```
▲ Next.js 16.x.x
- Local:        http://localhost:3000
✓ Ready in Xs
```

**⏱️ Time:** ~5-10 seconds

---

## 🏃 Step 5: Open the App

**What this does:** View the app in your web browser!

1. Open your browser
2. Go to: **http://localhost:3000**

**✅ You should see:** The SteadyLetters homepage with "Turn Your Thoughts Into Heartfelt Letters"

---

## 🧪 Testing the App

### Quick Health Check

```bash
# Check if the app is responding
curl http://localhost:3000/api/health
```

**✅ Expected:** `{"status":"ok"}` or similar JSON response

### Run All Automated Tests

```bash
# Run Jest unit tests
npm test

# Run Playwright E2E tests (in a new terminal)
npm run test:e2e:local
```

### Manual Testing Checklist

| Test | Steps | Expected Result |
|------|-------|-----------------|
| **Homepage loads** | Visit `/` | Hero section visible |
| **Sign up works** | Click "Sign Up", fill form | Account created |
| **Login works** | Click "Sign In", enter credentials | Redirected to dashboard |
| **Dashboard loads** | Visit `/dashboard` (logged in) | Stats cards visible |
| **Generate page** | Visit `/generate` | Voice/text input available |

---

## 🔧 Common Issues & Fixes

### Issue: "Cannot connect to database"

**Fix:**
```bash
# Check if Supabase is running
npx supabase status

# If not running, start it
npx supabase start
```

### Issue: "Port 3000 already in use"

**Fix:**
```bash
# Find and kill the process using port 3000
lsof -i :3000
kill -9 <PID>

# Or start on a different port
npm run dev -- -p 3001
```

### Issue: "Module not found"

**Fix:**
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### Issue: Docker not running

**Fix:**
1. Open Docker Desktop app
2. Wait for it to say "Docker is running"
3. Try again

---

## 📁 Key Project Files

| File/Folder | Purpose |
|-------------|---------|
| `src/app/` | All page routes (dashboard, login, etc.) |
| `src/components/` | Reusable UI components |
| `src/lib/` | Utility functions and API helpers |
| `.env` | Environment variables (API keys) |
| `package.json` | Dependencies and scripts |
| `prisma/` | Database schema |
| `supabase/` | Supabase configuration |

---

## 📜 Available Scripts

| Command | What It Does |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm test` | Run Jest tests |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run lint` | Check code style |
| `npx supabase start` | Start local database |
| `npx supabase stop` | Stop local database |

---

## 🔗 Useful URLs (When Running)

| URL | What's There |
|-----|-------------|
| http://localhost:3000 | Main app |
| http://localhost:3000/dashboard | User dashboard |
| http://localhost:3000/generate | Letter generator |
| http://localhost:3000/pricing | Pricing page |
| http://127.0.0.1:54421 | Supabase API |
| http://127.0.0.1:54423 | Supabase Studio (database UI) |

---

## ✅ System Status Checklist

Run through this checklist to verify everything is working:

- [ ] Docker is running
- [ ] Supabase started successfully (`npx supabase status`)
- [ ] Dependencies installed (`npm install` completed)
- [ ] Environment file exists (`.env` file present)
- [ ] Dev server running (`npm run dev`)
- [ ] Homepage loads (http://localhost:3000)
- [ ] API responds (`curl http://localhost:3000/api/health`)
- [ ] Tests pass (`npm test`)

---

## 🆘 Need Help?

1. Check the error message carefully
2. Look in `TESTING.md` for more detailed test instructions
3. Check `deployment_guide.md` for production setup
4. Review console/terminal output for clues

---

**Last Updated:** December 2024
