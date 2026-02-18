# Incremental Dev Actions Playbook
## Reusable step-by-step guide for building production iOS/React Native apps

This playbook documents every incremental development action taken to build SteadyLetters from scratch. Use it as a template for future apps.

---

## Phase 1: Foundation (Days 1-3)

### 1.1 Project Scaffolding
- [ ] `npx create-expo-app <name> --template tabs`
- [ ] Set up `app.json` (name, slug, bundleIdentifier, scheme, icons, splash)
- [ ] Configure `tsconfig.json` with path aliases (`@/` → `./`)
- [ ] Create `babel.config.js` and `metro.config.js`
- [ ] Set up `.gitignore` (include `.env`, `ios/`, `android/`, `node_modules/`)
- [ ] Create `.env` with `EXPO_PUBLIC_` prefixed vars
- [ ] Initialize Git repo, create `main` and `ios` branches

### 1.2 Folder Structure
```
app/
  (auth)/          # Auth screens (sign-in, sign-up, forgot-password)
  (tabs)/          # Main tab screens
  _layout.tsx      # Root layout with providers
components/        # Shared UI components
constants/         # Config, colors, types
providers/         # React context providers
services/          # API clients, business logic
assets/            # Images, fonts
```

### 1.3 Design System
- [ ] Create `constants/colors.ts` with light/dark themes
- [ ] Create `providers/ThemeProvider.tsx` (system/light/dark toggle)
- [ ] Define spacing, typography, border radius constants
- [ ] Choose icon library (lucide-react-native recommended)

### 1.4 Core Dependencies
```bash
# Navigation & UI
expo-router react-native-screens react-native-safe-area-context
react-native-gesture-handler react-native-reanimated lucide-react-native

# Auth & Backend
@supabase/supabase-js react-native-url-polyfill

# Storage & Media
expo-secure-store expo-file-system expo-image-picker expo-av

# Billing & Analytics
react-native-purchases posthog-react-native react-native-fbsdk-next
expo-tracking-transparency

# UX
expo-haptics expo-clipboard expo-sharing expo-notifications
```

---

## Phase 2: Auth & Backend (Days 3-5)

### 2.1 Supabase Setup
- [ ] Create Supabase project (or use `supabase init` + `supabase start` for local)
- [ ] Design database schema (tables, RLS policies, indexes)
- [ ] Create migrations: `supabase migration new <name>`
- [ ] Set up Row Level Security (RLS) on all user-data tables
- [ ] Configure auth settings (email confirm, OAuth providers)

### 2.2 Auth Provider
- [ ] Create `services/supabase.ts` (client init with env vars)
- [ ] Create `providers/AuthProvider.tsx`
  - getSession on mount (with `.catch()` for network errors!)
  - onAuthStateChange listener
  - signIn, signUp, signOut, resetPassword methods
- [ ] Create auth screens: sign-in, sign-up, forgot-password
  - returnKeyType flow between fields
  - Disabled opacity on buttons during loading
  - Trim email inputs
  - Friendly error messages for common failures

### 2.3 API Service Layer
- [ ] Create `services/api.ts` with:
  - `requireUser()` helper (throws if not authenticated)
  - `friendlyError()` mapper for Supabase error codes
  - CRUD functions for each entity
  - Graceful fallbacks if tables don't exist yet
- [ ] Map DB column names if schema differs from app types

### 2.4 Navigation Guards
- [ ] Tab layout: redirect to `/(auth)/sign-in` if `!user`
- [ ] Show loading skeleton while `isLoading`
- [ ] Register all screens in root `_layout.tsx`

---

## Phase 3: Core Features (Days 5-10)

### 3.1 Main App Screens
- [ ] Build tab screens (typically 4-5 tabs)
- [ ] Add empty states with icons + CTAs for each list screen
- [ ] Add pull-to-refresh on list screens
- [ ] Add skeleton loading states

### 3.2 Modal Screens
- [ ] Register modals in root layout with `presentation: 'modal'`
- [ ] Ensure `headerShown: true` on modals for close/back button
- [ ] Use `useFocusEffect` to refresh data when returning from modals

### 3.3 External API Integration
- [ ] Create typed service files (e.g., `services/openai.ts`, `services/thanks-io.ts`)
- [ ] Add for EVERY external API call:
  - AbortController timeout (15-60s depending on service)
  - Network error detection (`Network request failed`, `Failed to fetch`)
  - HTTP status-specific messages (401, 422, 429, 5xx)
  - Rate limit handling
  - User-friendly error strings (never expose raw API errors)

### 3.4 Form UX Patterns
- [ ] `returnKeyType` chain: next → next → done (triggers submit)
- [ ] `autoCapitalize`, `autoComplete`, `keyboardType` on all inputs
- [ ] Field-level validation with specific error messages
- [ ] Success haptic feedback + alert on form submissions
- [ ] `KeyboardAvoidingView` on all form screens
- [ ] `keyboardShouldPersistTaps="handled"` on ScrollViews

---

## Phase 4: Billing & Monetization (Days 10-13)

### 4.1 RevenueCat Setup
- [ ] Create RevenueCat project at app.revenuecat.com
- [ ] Create products in App Store Connect:
  - `sl_pro_monthly`, `sl_pro_annual`
  - `sl_business_monthly`, `sl_business_annual`
- [ ] Configure offerings in RevenueCat dashboard
- [ ] Create entitlements: `pro`, `business`
- [ ] Install `react-native-purchases`

### 4.2 BillingProvider
- [ ] Create `providers/BillingProvider.tsx`
  - Graceful degradation if API key missing (default to free tier)
  - `Purchases.configure()` → `getOfferings()` → `getCustomerInfo()`
  - `Purchases.logIn(userId)` when auth state changes
  - `addCustomerInfoUpdateListener` for real-time tier changes
  - `purchasePackage()` with event tracking
  - `restorePurchases()` with event tracking
- [ ] Define tier config in `constants/config.ts`
  - Feature limits per tier
  - Allowed product types per tier
  - Price per tier

### 4.3 Paywall Screen
- [ ] Show all tiers with feature comparison
- [ ] Highlight current plan with checkmark
- [ ] "Most Popular" / "Best Value" badges
- [ ] Disable selection on current plan
- [ ] Restore purchases button at bottom
- [ ] Lock icons on restricted features throughout app

---

## Phase 5: Analytics & Tracking (Days 13-15)

### 5.1 Unified Event Service
- [ ] Create `services/events.ts` that bridges:
  - **PostHog** (product analytics, funnels, session replay)
  - **Meta Ads** (attribution, conversion tracking, ROAS)
  - **RevenueCat** (user attributes for subscription segmentation)
- [ ] Define standard event names (sign_up, purchase_completed, etc.)
- [ ] Map app events to standard Meta Ads events (fb_mobile_purchase, etc.)

### 5.2 Meta Ads (Facebook SDK)
- [ ] Install `react-native-fbsdk-next` + `expo-tracking-transparency`
- [ ] Add `NSUserTrackingUsageDescription` to Info.plist (via plugin)
- [ ] Request ATT permission on app launch
- [ ] Track key conversion events:
  - Registration, first letter sent, purchase, revenue

### 5.3 PostHog
- [ ] Create `providers/AnalyticsProvider.tsx`
- [ ] Auto-capture: screen views, touches, lifecycle events
- [ ] Identify users on sign-in
- [ ] Bridge to unified events service

---

## Phase 6: Polish & Hardening (Days 15-18)

### 6.1 Error Handling
- [ ] Global `ErrorBoundary` component wrapping root layout
- [ ] AuthProvider: `.catch()` on `getSession()` (prevent red screen on network failure)
- [ ] BillingProvider: graceful degradation without API key
- [ ] AnalyticsProvider: graceful degradation without API key
- [ ] Notifications: graceful push token registration
- [ ] All API calls: try/catch with user-friendly Alert messages

### 6.2 iOS-Specific Config
- [ ] `NSAppTransportSecurity.NSAllowsLocalNetworking` for local dev
- [ ] Info.plist permissions: microphone, camera, photo library, tracking
- [ ] `expo-dev-client` plugin for development builds
- [ ] `runtimeVersion` for OTA updates

### 6.3 Accessibility
- [ ] `accessibilityLabel` on all interactive elements
- [ ] `accessibilityRole="button"` on all TouchableOpacity
- [ ] Sufficient color contrast (4.5:1 minimum)
- [ ] Support Dynamic Type (use relative font sizes)

### 6.4 Performance
- [ ] `memo()` on expensive list item components
- [ ] `useCallback` on event handlers passed as props
- [ ] `FlatList` instead of `ScrollView` for long lists
- [ ] Skeleton loading states instead of spinners

---

## Phase 7: Testing & Launch Prep (Days 18-21)

### 7.1 Local Testing
- [ ] Start local Supabase: `supabase start`
- [ ] Create test user via API
- [ ] Build dev client: `npx expo run:ios`
- [ ] Test complete user flows:
  - Sign up → verify email → sign in → create content → send → view orders
  - Paywall → purchase → tier upgrade → access new features
  - Settings → theme toggle → sign out

### 7.2 Automated Tests
- [ ] Unit tests for service functions (jest)
- [ ] Integration tests for API endpoints
- [ ] Live API smoke tests (optional, with real keys)

### 7.3 App Store Submission
- [ ] Generate app icons (1024x1024 + all sizes)
- [ ] Create App Store screenshots (6.7", 6.5", 5.5")
- [ ] Write App Store description, keywords, subtitle
- [ ] Set up App Store Connect: pricing, availability, age rating
- [ ] Archive build from Xcode: Product → Archive → Distribute
- [ ] Or use EAS Build: `eas build --platform ios --profile production`
- [ ] Submit for review

---

## Phase 8: Post-Launch (Ongoing)

### 8.1 Monitoring
- [ ] PostHog dashboards: DAU, retention, funnel completion
- [ ] RevenueCat dashboards: MRR, churn, trial conversion
- [ ] Meta Ads: ROAS, CPA, audience insights
- [ ] Error monitoring (Sentry or similar)

### 8.2 Iteration
- [ ] A/B test paywall designs
- [ ] Optimize onboarding funnel
- [ ] Add features based on user feedback
- [ ] Regular dependency updates

---

## Quick Reference: Common Gotchas

| Issue | Fix |
|-------|-----|
| iOS blocks HTTP localhost | `NSAppTransportSecurity.NSAllowsLocalNetworking: true` in Info.plist |
| Red error screen on network fail | Wrap `getSession()` in `.catch()` in AuthProvider |
| Expo Go unavailable on new iOS | Use `expo-dev-client` + `npx expo run:ios` |
| DALL-E 3 n>1 fails | Run parallel single requests |
| FormData file upload in RN | Use `{ uri, type, name }` cast as Blob |
| RevenueCat without key | Graceful degradation to free tier |
| ATT crash on simulator | Must configure plugin with `userTrackingPermission` string |
| DB column name mismatch | Create mapping layer in API service |
| Supabase port changes | Check `supabase status` for current ports |
