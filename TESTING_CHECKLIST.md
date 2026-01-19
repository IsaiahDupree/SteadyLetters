# ✅ SteadyLetters - Complete Testing Checklist

A comprehensive checklist to verify the app is fully functional before launch.

---

## 🔧 Pre-Testing Setup

Before testing, ensure the following are running:

| Component | Command | Verify |
|-----------|---------|--------|
| Docker | Open Docker Desktop | Shows "Running" |
| Supabase | `npx supabase start` | API URL shown |
| Dev Server | `npm run dev` | "Ready" message |

---

## 📋 Section 1: Infrastructure Tests

### 1.1 Database Connection
```bash
# Test database connectivity
npx supabase status
```

| Check | Expected | ✅/❌ |
|-------|----------|-------|
| Supabase running | Shows API/DB URLs | |
| DB accessible | No connection errors | |
| Migrations applied | Tables exist | |

### 1.2 API Health
```bash
# Test API health endpoint
curl http://localhost:3000/api/health
```

| Check | Expected | ✅/❌ |
|-------|----------|-------|
| Returns 200 status | `{"status":"ok"}` | |
| Response time < 500ms | Fast response | |

### 1.3 Environment Variables
```bash
# Verify env vars are loaded
npm run check:env
```

| Variable | Required | ✅/❌ |
|----------|----------|-------|
| DATABASE_URL | Yes | |
| NEXT_PUBLIC_SUPABASE_URL | Yes | |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Yes | |
| OPENAI_API_KEY | Yes | |
| STRIPE_SECRET_KEY | Yes | |
| STRIPE_PUBLISHABLE_KEY | Yes | |

---

## 📋 Section 2: Page Load Tests

Visit each page and verify it loads without errors.

### Public Pages (No Login Required)

| Page | URL | Loads | No Console Errors | ✅/❌ |
|------|-----|-------|-------------------|-------|
| Homepage | `/` | | | |
| Pricing | `/pricing` | | | |
| Login | `/login` | | | |
| Sign Up | `/signup` | | | |
| Terms | `/terms` | | | |
| Privacy | `/privacy` | | | |

### Protected Pages (Login Required)

| Page | URL | Loads | No Console Errors | ✅/❌ |
|------|-----|-------|-------------------|-------|
| Dashboard | `/dashboard` | | | |
| Generate | `/generate` | | | |
| Send | `/send` | | | |
| Recipients | `/recipients` | | | |
| Templates | `/templates` | | | |
| Orders | `/orders` | | | |
| Billing | `/billing` | | | |
| Analytics | `/analytics` | | | |
| Settings | `/settings` | | | |

---

## 📋 Section 3: Authentication Tests

### 3.1 Sign Up Flow

| Step | Action | Expected | ✅/❌ |
|------|--------|----------|-------|
| 1 | Go to `/signup` | Form displays | |
| 2 | Enter valid email | No validation error | |
| 3 | Enter password (8+ chars) | No validation error | |
| 4 | Click "Sign Up" | Account created | |
| 5 | Check email | Confirmation sent | |
| 6 | Click confirmation link | Email verified | |
| 7 | Redirect to dashboard | Dashboard loads | |

### 3.2 Login Flow

| Step | Action | Expected | ✅/❌ |
|------|--------|----------|-------|
| 1 | Go to `/login` | Form displays | |
| 2 | Enter registered email | No validation error | |
| 3 | Enter correct password | No validation error | |
| 4 | Click "Sign In" | Login successful | |
| 5 | Redirect to dashboard | Dashboard loads | |
| 6 | Navbar shows email | User email visible | |

### 3.3 Logout Flow

| Step | Action | Expected | ✅/❌ |
|------|--------|----------|-------|
| 1 | Click "Sign Out" | Session ends | |
| 2 | Redirect to home | Homepage loads | |
| 3 | Try accessing `/dashboard` | Redirected to login | |

### 3.4 Error Handling

| Scenario | Expected | ✅/❌ |
|----------|----------|-------|
| Wrong password | "Invalid credentials" error | |
| Non-existent email | Appropriate error message | |
| Empty fields | Validation errors shown | |

---

## 📋 Section 4: Core Feature Tests

### 4.1 Letter Generation

| Test | Steps | Expected | ✅/❌ |
|------|-------|----------|-------|
| Text input | Type message, click generate | Letter generated | |
| Voice input | Click record, speak, stop | Text transcribed | |
| AI enhancement | Click enhance | Text improved | |
| Preview | View generated letter | Displays correctly | |

### 4.2 Recipient Management

| Test | Steps | Expected | ✅/❌ |
|------|-------|----------|-------|
| Add recipient | Fill form, save | Recipient added | |
| View recipients | Go to `/recipients` | List displays | |
| Edit recipient | Click edit, modify, save | Changes saved | |
| Delete recipient | Click delete, confirm | Recipient removed | |
| Address validation | Enter invalid address | Error shown | |

### 4.3 Template Selection

| Test | Steps | Expected | ✅/❌ |
|------|-------|----------|-------|
| View templates | Go to `/templates` | Templates display | |
| Select template | Click on template | Template selected | |
| Preview template | View preview | Shows design | |

### 4.4 Order Creation

| Test | Steps | Expected | ✅/❌ |
|------|-------|----------|-------|
| Create order | Select recipient, template, letter | Order created | |
| View order | Go to `/orders` | Order in list | |
| Order details | Click order | Details display | |
| Order status | Check status | Shows current state | |

---

## 📋 Section 5: Payment Tests

### 5.1 Stripe Integration

| Test | Steps | Expected | ✅/❌ |
|------|-------|----------|-------|
| Pricing page loads | Go to `/pricing` | Plans displayed | |
| Plan prices correct | Verify prices | Match configuration | |
| Subscribe button | Click subscribe | Stripe checkout opens | |

### 5.2 Subscription Flow (Use Stripe Test Mode)

| Test | Steps | Expected | ✅/❌ |
|------|-------|----------|-------|
| Pro subscription | Use test card `4242...` | Subscription created | |
| Billing page | Go to `/billing` | Subscription shown | |
| Cancel subscription | Click cancel | Subscription ends | |

**Test Card:** `4242 4242 4242 4242` (any future date, any CVC)

---

## 📋 Section 6: API Tests

### 6.1 Run Automated Tests
```bash
# Run all Jest tests
npm test

# Run E2E tests
npm run test:e2e:local
```

| Test Suite | Command | Pass/Fail | ✅/❌ |
|------------|---------|-----------|-------|
| Unit tests | `npm test` | | |
| API tests | `npm test -- tests/api-endpoints.test.mjs` | | |
| E2E tests | `npm run test:e2e:local` | | |

### 6.2 Manual API Tests

```bash
# Test endpoints manually
curl http://localhost:3000/api/health
curl http://localhost:3000/api/templates
```

| Endpoint | Method | Expected Status | ✅/❌ |
|----------|--------|-----------------|-------|
| `/api/health` | GET | 200 | |
| `/api/templates` | GET | 200 or 401 | |
| `/api/recipients` | GET | 401 (unauth) | |
| `/api/orders` | GET | 401 (unauth) | |

---

## 📋 Section 7: UI/UX Tests

### 7.1 Visual Checks

| Check | Pages | Expected | ✅/❌ |
|-------|-------|----------|-------|
| Logo displays | All pages | Logo visible | |
| Colors correct | All pages | Brand colors | |
| Fonts load | All pages | Custom fonts | |
| Icons render | All pages | Lucide icons | |
| No broken images | All pages | All images load | |

### 7.2 Responsive Design

| Viewport | Test Pages | No Overflow | Readable | ✅/❌ |
|----------|------------|-------------|----------|-------|
| 375px (iPhone SE) | Homepage, Dashboard | | | |
| 390px (iPhone 12) | All pages | | | |
| 768px (Tablet) | All pages | | | |
| 1024px (Laptop) | All pages | | | |
| 1440px (Desktop) | All pages | | | |

### 7.3 Accessibility

| Check | How to Test | Pass | ✅/❌ |
|-------|-------------|------|-------|
| Keyboard navigation | Tab through page | All elements reachable | |
| Focus indicators | Tab through page | Focus visible | |
| Alt text on images | Inspect images | Alt text present | |
| Color contrast | Use contrast checker | Ratio ≥ 4.5:1 | |

---

## 📋 Section 8: Performance Tests

### 8.1 Lighthouse Audit

Run in Chrome DevTools → Lighthouse

| Metric | Target | Score | ✅/❌ |
|--------|--------|-------|-------|
| Performance | ≥ 80 | | |
| Accessibility | ≥ 90 | | |
| Best Practices | ≥ 90 | | |
| SEO | ≥ 90 | | |

### 8.2 Load Times

| Page | Target | Actual | ✅/❌ |
|------|--------|--------|-------|
| Homepage | < 2s | | |
| Dashboard | < 3s | | |
| Generate | < 2s | | |

---

## 📋 Section 9: Security Tests

### 9.1 Authentication Security

| Check | Test | Expected | ✅/❌ |
|-------|------|----------|-------|
| Protected routes | Access `/dashboard` logged out | Redirected to login | |
| Session expiry | Wait for timeout | Logged out | |
| Secure cookies | Check cookie flags | HttpOnly, Secure | |

### 9.2 API Security

| Check | Test | Expected | ✅/❌ |
|-------|------|----------|-------|
| Auth required | Call protected endpoint | 401 response | |
| Rate limiting | Rapid requests | 429 response | |
| Input validation | Send malformed data | Error handled | |

---

## 📋 Section 10: Integration Tests

### 10.1 Third-Party Services

| Service | Test | Expected | ✅/❌ |
|---------|------|----------|-------|
| OpenAI | Generate letter | Text returned | |
| Stripe | Load checkout | Stripe UI appears | |
| Supabase Auth | Login/signup | Auth works | |

### 10.2 Email Notifications

| Event | Email Sent | Content Correct | ✅/❌ |
|-------|------------|-----------------|-------|
| Sign up | Welcome email | | |
| Order placed | Confirmation | | |
| Password reset | Reset link | | |

---

## 📋 Section 11: Error Handling

### 11.1 Graceful Degradation

| Scenario | Expected Behavior | ✅/❌ |
|----------|-------------------|-------|
| API timeout | Error message, retry option | |
| Network offline | Offline indicator | |
| Invalid form input | Clear error messages | |
| 404 page | Custom 404 page | |
| 500 error | Error boundary, message | |

---

## 📋 Final Sign-Off

### Summary

| Section | Tests Passed | Tests Failed | Notes |
|---------|--------------|--------------|-------|
| Infrastructure | /3 | | |
| Page Loads | /15 | | |
| Authentication | /15 | | |
| Core Features | /15 | | |
| Payments | /6 | | |
| APIs | /8 | | |
| UI/UX | /15 | | |
| Performance | /7 | | |
| Security | /6 | | |
| Integrations | /6 | | |
| Error Handling | /5 | | |
| **TOTAL** | /101 | | |

### Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| QA Tester | | | |
| Product Owner | | | |

---

## 🚀 Ready for Launch?

- [ ] All critical tests pass
- [ ] No console errors
- [ ] Performance scores meet targets
- [ ] Security checks complete
- [ ] All team approvals received

---

**Document Created:** December 2024  
**Version:** 1.0
