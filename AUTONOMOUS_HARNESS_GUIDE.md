# Autonomous Development Harness Guide

**SteadyLetters (KindLetters) Project**
**Version:** 1.0
**Last Updated:** January 20, 2026

---

## Overview

This project uses an autonomous coding harness to incrementally implement features. Each feature is tracked in `feature_list.json` with a pass/fail status. Autonomous agents work through features sequentially, implementing code, running tests, and updating the feature list.

---

## Quick Start for Autonomous Agents

### 1. Check Current Status
```bash
# View feature list
cat feature_list.json | jq '.features[] | select(.passes == false) | {id, name, priority}'

# View progress log
tail -50 claude-progress.txt

# Check harness status
cat harness-status.json
```

### 2. Select Next Feature
Priority order:
1. **P0** (Critical) - Core functionality
2. **P1** (High) - Important features
3. **P2** (Medium) - Nice to have
4. **P3** (Low) - Future enhancements

Current focus: **Phase 6 (Mobile) and Phase 7 (Security)**

### 3. Implement Feature
1. Read the feature's `files`, `description`, and `acceptance` criteria
2. Review existing code in the specified files
3. Implement the feature according to PRD requirements
4. Write/update tests if needed
5. Run tests to verify

### 4. Update Feature Status
Once all acceptance criteria are met:
```json
{
  "id": "MOB-001",
  "name": "Mobile Hamburger Menu",
  "passes": true  // Changed from false
}
```

### 5. Log Progress
Append to `claude-progress.txt`:
```
## SESSION N: [Feature ID] - [Feature Name]
**Date:** [Date]
**Agent:** [Agent Name]
**Status:** Complete

### Implementation:
- [What you did]
- [Files modified]
- [Tests added/updated]

### Verification:
- [How you verified it works]
- [Test results]
```

---

## File Structure

### Critical Files

| File | Purpose | Agent Action |
|------|---------|--------------|
| `feature_list.json` | Feature tracking (71 features) | Update `passes` field when complete |
| `claude-progress.txt` | Session log | Append progress after each feature |
| `harness-status.json` | Harness state (auto-updated) | Read only |
| `DEVELOPER_HANDOFF.md` | Project documentation | Reference for understanding |
| `PRD_*.md` | Product requirements | Reference for implementation details |

### Code Files

```
src/
├── app/
│   ├── actions/          # Server actions (database CRUD)
│   │   ├── recipients.ts
│   │   ├── templates.ts
│   │   ├── orders.ts
│   │   └── dashboard.ts
│   ├── api/              # API routes
│   │   ├── generate/
│   │   ├── transcribe/
│   │   ├── webhooks/
│   │   └── stripe/
│   └── [pages]/          # Next.js pages
├── components/           # React components
│   ├── navbar.tsx        # ⚠️ Needs mobile menu (MOB-001)
│   ├── voice-recorder.tsx
│   └── ui/               # shadcn/ui components
└── lib/                  # Utilities
    ├── thanks-io.ts      # Thanks.io API client
    ├── openai.ts         # OpenAI integrations
    ├── usage.ts          # Usage tracking
    └── tiers.ts          # Tier limits
```

---

## Feature Workflow

### Standard Feature Implementation

1. **Understand Requirements**
   - Read feature description in `feature_list.json`
   - Review acceptance criteria
   - Check related PRD document if referenced
   - Read current implementation in listed files

2. **Plan Implementation**
   - Identify files to modify/create
   - Plan test strategy
   - Consider edge cases

3. **Implement**
   - Write code following existing patterns
   - Use TypeScript strictly
   - Follow Next.js 13+ App Router conventions
   - Use Prisma for database operations
   - Use Supabase for auth and storage

4. **Test**
   ```bash
   # Run relevant tests
   npm test                    # Unit tests
   npm run test:e2e           # E2E tests
   npm run lint               # Linting
   npm run build              # Build check
   ```

5. **Update Feature List**
   - Set `passes: true` in `feature_list.json`
   - Increment `completedFeatures` count
   - Commit changes

6. **Log Progress**
   - Append detailed log to `claude-progress.txt`
   - Include what was done, files changed, tests run

---

## Current Development Phase

### Phase 6: Mobile Optimization (10 features)

**Priority:** HIGH
**Status:** Not started (0/10 complete)

Next features to implement:

#### MOB-001: Mobile Hamburger Menu
**Files:** `src/components/navbar.tsx`
**Effort:** 3h
**Acceptance:**
- Hamburger icon on mobile
- Slide-out menu
- Menu closes on navigation

**Implementation Notes:**
- Use `lucide-react` for Menu/X icons (already installed)
- Add `useState` for menu toggle
- Use Tailwind responsive classes (md:hidden, etc.)
- Add overlay with click-to-close
- See `PRD_MOBILE_OPTIMIZATION.md` for detailed specs

#### MOB-002: Mobile Menu Overlay
**Files:** `src/components/navbar.tsx`
**Effort:** 1h
**Acceptance:**
- Overlay appears behind menu
- Tap to close menu

#### MOB-003: Touch Target Utility
**Files:** `src/app/globals.css`
**Effort:** 1h
**Acceptance:**
- `.touch-target` class with 44x44px minimum
- Applied to interactive elements

#### MOB-004: iOS Input Zoom Fix
**Files:** `src/app/globals.css`
**Effort:** 30m
**Acceptance:**
- Inputs have 16px font on mobile
- No zoom on focus

---

### Phase 7: Security Hardening (8 features)

**Priority:** HIGH
**Status:** Not started (0/8 complete)

#### SEC-001: Thanks.io Webhook Signature
**Files:** `src/app/api/webhooks/thanks/route.ts`
**Effort:** 1h
**Acceptance:**
- Signature verified
- Invalid requests rejected with 401

**Implementation Notes:**
- Add `THANKS_IO_WEBHOOK_SECRET` env var
- Verify signature header on incoming webhooks
- Return 401 if signature invalid
- See `PRD_SECURITY_HARDENING.md` for details

---

## Testing Strategy

### Unit Tests (Jest)
- Location: `tests/unit/`
- Run: `npm test`
- Focus: API routes, server actions, utilities

### E2E Tests (Playwright)
- Location: `tests/e2e/`
- Run: `npm run test:e2e`
- Focus: User flows, critical paths

### Manual Testing
- Run dev server: `npm run dev`
- Test feature in browser
- Verify on mobile viewport (375px, 768px)
- Check console for errors

---

## Code Standards

### TypeScript
- Strict mode enabled
- No `any` types (use proper interfaces)
- Define types for API responses
- Use Zod for runtime validation

### React/Next.js
- Use App Router conventions
- Server Components by default
- Client Components only when needed (`'use client'`)
- Server Actions for mutations
- API Routes for external APIs

### Styling
- Tailwind CSS 4
- Use shadcn/ui components
- Mobile-first responsive design
- Follow existing component patterns

### Database
- Use Prisma ORM
- Define models in `prisma/schema.prisma`
- Run `npx prisma generate` after schema changes
- Use transactions for multi-step operations

---

## Common Patterns

### Server Actions
```typescript
'use server'

import { getCurrentUser } from '@/lib/server-auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createRecipient(data: RecipientInput) {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  try {
    const recipient = await prisma.recipient.create({
      data: {
        ...data,
        userId: user.id,
      },
    })

    revalidatePath('/recipients')
    return { success: true, data: recipient }
  } catch (error) {
    return { success: false, error: 'Failed to create recipient' }
  }
}
```

### API Routes
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    // ... process request

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Usage Limit Checking
```typescript
import { checkUsageLimit, incrementUsage } from '@/lib/usage'

// Before expensive operation
const canGenerate = await checkUsageLimit(userId, 'letterGenerations')
if (!canGenerate) {
  return { success: false, error: 'Usage limit exceeded' }
}

// After successful operation
await incrementUsage(userId, 'letterGenerations')
```

---

## Environment Variables

Required for development (see `.env.local`):

```env
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
THANKS_IO_API_KEY=...
```

Missing API keys will cause mock fallbacks in some integrations.

---

## Troubleshooting

### Tests Failing
1. Check if database is running
2. Verify environment variables
3. Run `npx prisma generate`
4. Check test output for specific errors

### Build Failing
1. Run `npm run lint` to check for errors
2. Check for TypeScript errors
3. Verify all imports are correct
4. Check Next.js console output

### Feature Not Working
1. Check browser console for errors
2. Check server logs (`npm run dev` output)
3. Verify database records in Prisma Studio
4. Test API endpoints directly (curl or Postman)

---

## Agent Session Template

Use this template when logging progress:

```markdown
## SESSION [N]: [FEATURE-ID] - [Feature Name]
**Date:** [Date]
**Agent:** [Your Agent Name]
**Phase:** [Phase Number and Name]
**Status:** [Complete/Blocked/In Progress]

### Goal:
[What feature you're implementing]

### Implementation Steps:
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Files Modified:
- `path/to/file1.ts` - [What changed]
- `path/to/file2.tsx` - [What changed]

### Tests:
- [Test description] - ✅ Passing
- [Test description] - ✅ Passing

### Verification:
- [x] Acceptance criterion 1
- [x] Acceptance criterion 2
- [x] Acceptance criterion 3

### feature_list.json Updates:
- Set `FEATURE-ID.passes = true`
- Updated `completedFeatures` count

### Notes:
[Any important notes, gotchas, or future considerations]

---
```

---

## Next Steps

The next autonomous agent should:

1. Start with **MOB-001** (Mobile Hamburger Menu)
2. Read `PRD_MOBILE_OPTIMIZATION.md` for detailed requirements
3. Review current `src/components/navbar.tsx` implementation
4. Implement hamburger menu with overlay
5. Test on mobile viewport
6. Update `feature_list.json`
7. Log progress in `claude-progress.txt`

After MOB-001, continue with MOB-002 through MOB-010, then move to Phase 7 security features.

---

**Document Version:** 1.0
**Created:** January 20, 2026
**For:** Autonomous Development Agents
